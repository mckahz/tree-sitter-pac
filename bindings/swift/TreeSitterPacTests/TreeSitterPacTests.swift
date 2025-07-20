import XCTest
import SwiftTreeSitter
import TreeSitterPac

final class TreeSitterPacTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_pac())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Pixel Art Console grammar")
    }
}
