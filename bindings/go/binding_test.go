package tree_sitter_pac_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_pac "github.com/tree-sitter/tree-sitter-pac/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_pac.Language())
	if language == nil {
		t.Errorf("Error loading Pixel Art Console grammar")
	}
}
