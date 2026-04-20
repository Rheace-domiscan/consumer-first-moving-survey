import AppKit
import AVFoundation
import Foundation
import Vision

struct Classification: Codable {
  let identifier: String
  let confidence: Double
  let source: String
}

struct DetectedText: Codable {
  let text: String
  let confidence: Double
  let source: String
}

struct AnalysisIssue: Codable {
  let code: String
  let message: String
}

struct AnalysisOutput: Codable {
  let version: String
  let kind: String
  let pixelWidth: Int?
  let pixelHeight: Int?
  let durationSeconds: Double?
  let framesAnalyzed: Int
  let classifications: [Classification]
  let texts: [DetectedText]
  let issues: [AnalysisIssue]
}

enum AnalyzerError: Error, CustomStringConvertible {
  case missingFileArgument
  case unreadableImage(String)
  case unreadableVideo(String)
  case unsupportedKind(String)

  var description: String {
    switch self {
    case .missingFileArgument:
      return "A file path is required. Use --file <path>."
    case .unreadableImage(let path):
      return "Unable to load image at \(path)."
    case .unreadableVideo(let path):
      return "Unable to load video at \(path)."
    case .unsupportedKind(let kind):
      return "Unsupported media kind \(kind)."
    }
  }
}

struct VisionAnalyzer {
  static func run() {
    do {
      let options = try parseArguments()
      let output = try analyze(filePath: options.filePath, kind: options.kind)
      let encoder = JSONEncoder()
      encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
      let data = try encoder.encode(output)
      FileHandle.standardOutput.write(data)
    } catch {
      FileHandle.standardError.write(Data((error.localizedDescription.isEmpty ? String(describing: error) : error.localizedDescription).utf8))
      exit(1)
    }
  }

  private static func parseArguments() throws -> (filePath: String, kind: String?) {
    var filePath: String?
    var kind: String?
    let args = Array(CommandLine.arguments.dropFirst())
    var index = 0

    while index < args.count {
      switch args[index] {
      case "--file":
        index += 1
        guard index < args.count else {
          throw AnalyzerError.missingFileArgument
        }
        filePath = args[index]
      case "--kind":
        index += 1
        if index < args.count {
          kind = args[index]
        }
      default:
        break
      }

      index += 1
    }

    guard let filePath else {
      throw AnalyzerError.missingFileArgument
    }

    return (filePath, kind)
  }

  private static func analyze(filePath: String, kind: String?) throws -> AnalysisOutput {
    let url = URL(fileURLWithPath: filePath)
    let resolvedKind = (kind ?? inferKind(from: url.pathExtension)).uppercased()

    switch resolvedKind {
    case "IMAGE":
      return try analyzeImage(at: url)
    case "VIDEO":
      return try analyzeVideo(at: url)
    default:
      throw AnalyzerError.unsupportedKind(resolvedKind)
    }
  }

  private static func analyzeImage(at url: URL) throws -> AnalysisOutput {
    guard let image = NSImage(contentsOf: url),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil)
    else {
      throw AnalyzerError.unreadableImage(url.path)
    }

    let frame = try analyzeFrame(cgImage: cgImage, source: "image")
    return AnalysisOutput(
      version: "apple-vision-v1",
      kind: "IMAGE",
      pixelWidth: cgImage.width,
      pixelHeight: cgImage.height,
      durationSeconds: nil,
      framesAnalyzed: 1,
      classifications: frame.classifications,
      texts: frame.texts,
      issues: frame.issues,
    )
  }

  private static func analyzeVideo(at url: URL) throws -> AnalysisOutput {
    let asset = AVURLAsset(url: url)
    let durationSeconds = asset.duration.seconds.isFinite ? max(asset.duration.seconds, 0) : 0
    let generator = AVAssetImageGenerator(asset: asset)
    generator.appliesPreferredTrackTransform = true
    generator.maximumSize = CGSize(width: 1600, height: 1600)

    let sampleFractions: [Double] = durationSeconds > 0
      ? [0.15, 0.5, 0.85]
      : [0]

    var frames: [FrameAnalysis] = []
    var pixelWidth: Int?
    var pixelHeight: Int?

    for fraction in sampleFractions {
      let second = durationSeconds > 0 ? durationSeconds * fraction : 0
      let time = CMTime(seconds: second, preferredTimescale: 600)

      do {
        var actualTime = CMTime.zero
        let cgImage = try generator.copyCGImage(at: time, actualTime: &actualTime)
        pixelWidth = pixelWidth ?? cgImage.width
        pixelHeight = pixelHeight ?? cgImage.height
        frames.append(try analyzeFrame(cgImage: cgImage, source: "video_frame"))
      } catch {
        frames.append(
          FrameAnalysis(
            classifications: [],
            texts: [],
            issues: [AnalysisIssue(code: "FRAME_EXTRACTION_FAILED", message: "Failed to extract a representative frame.")],
          )
        )
      }
    }

    guard !frames.isEmpty else {
      throw AnalyzerError.unreadableVideo(url.path)
    }

    return AnalysisOutput(
      version: "apple-vision-v1",
      kind: "VIDEO",
      pixelWidth: pixelWidth,
      pixelHeight: pixelHeight,
      durationSeconds: durationSeconds > 0 ? durationSeconds : nil,
      framesAnalyzed: frames.count,
      classifications: mergeClassifications(from: frames),
      texts: mergeTexts(from: frames),
      issues: frames.flatMap(\.issues),
    )
  }

  private static func analyzeFrame(cgImage: CGImage, source: String) throws -> FrameAnalysis {
    guard cgImage.width > 2, cgImage.height > 2 else {
      return FrameAnalysis(
        classifications: [],
        texts: [],
        issues: [AnalysisIssue(code: "IMAGE_TOO_SMALL", message: "Image must be larger than 2x2 pixels for Vision requests.")],
      )
    }

    let classify = VNClassifyImageRequest()
    let text = VNRecognizeTextRequest()
    text.recognitionLevel = .accurate
    text.usesLanguageCorrection = true
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

    do {
      try handler.perform([classify, text])
    } catch {
      return FrameAnalysis(
        classifications: [],
        texts: [],
        issues: [AnalysisIssue(code: "VISION_REQUEST_FAILED", message: error.localizedDescription)],
      )
    }

    let classifications = (classify.results ?? []).prefix(12).map {
      Classification(identifier: $0.identifier, confidence: Double($0.confidence), source: source)
    }

    let texts = (text.results ?? [])
      .compactMap { observation -> DetectedText? in
        guard let top = observation.topCandidates(1).first else {
          return nil
        }

        let normalized = top.string
          .trimmingCharacters(in: .whitespacesAndNewlines)
          .replacingOccurrences(of: "\n", with: " ")

        guard normalized.count >= 2 else {
          return nil
        }

        return DetectedText(text: normalized, confidence: Double(top.confidence), source: source)
      }

    return FrameAnalysis(classifications: classifications, texts: texts, issues: [])
  }

  private static func mergeClassifications(from frames: [FrameAnalysis]) -> [Classification] {
    var merged: [String: Classification] = [:]

    for frame in frames {
      for classification in frame.classifications {
        if let current = merged[classification.identifier], current.confidence >= classification.confidence {
          continue
        }

        merged[classification.identifier] = classification
      }
    }

    return merged.values.sorted { left, right in
      if left.confidence == right.confidence {
        return left.identifier < right.identifier
      }

      return left.confidence > right.confidence
    }
  }

  private static func mergeTexts(from frames: [FrameAnalysis]) -> [DetectedText] {
    var merged: [String: DetectedText] = [:]

    for frame in frames {
      for text in frame.texts {
        let key = text.text.lowercased()
        if let current = merged[key], current.confidence >= text.confidence {
          continue
        }

        merged[key] = text
      }
    }

    return merged.values.sorted { left, right in
      if left.confidence == right.confidence {
        return left.text < right.text
      }

      return left.confidence > right.confidence
    }
  }

  private static func inferKind(from pathExtension: String) -> String {
    let ext = pathExtension.lowercased()

    switch ext {
    case "mp4", "mov", "m4v", "avi", "hevc":
      return "VIDEO"
    default:
      return "IMAGE"
    }
  }
}

private struct FrameAnalysis {
  let classifications: [Classification]
  let texts: [DetectedText]
  let issues: [AnalysisIssue]
}

VisionAnalyzer.run()
