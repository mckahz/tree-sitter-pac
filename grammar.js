/**
 * @file A parser for the Pixel Art Console language
 * @author mckahz <fletchusmaximus@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const pascal_case = new RustRegex("[A-Z]+[a-zA-Z]*");
const snake_case = new RustRegex("[a-z_]+[a-z0-9_]*");
const comma_seperated = (rule) =>
  optional(seq(optional(","), rule, repeat(seq(",", rule)), optional(",")));

module.exports = grammar({
  name: "pac",

  rules: {
    source_file: ($) => seq($.module_decl, repeat($._statement)),
    module_decl: ($) => seq("module", $.module_name, "[];"),
    module_name: ($) => pascal_case,

    type_ident: ($) => pascal_case,
    value_ident: ($) => seq(snake_case, optional("?")),

    _type: ($) => choice($.primative_type, $.higher_kinded_type),
    type_param: ($) => snake_case,
    higher_kinded_type: ($) => seq($.type_ident, repeat1($.primative_type)),
    primative_type: ($) => choice("Bool", "Int", "String", "()"),

    _expr: ($) =>
      choice($.if_expr, $.binary_expr, $.unary_expr, $.application, $._term),
    unary_expr: ($) => prec(2, choice(seq("-", $._expr), seq("!", $._expr))),
    binary_expr: ($) =>
      choice(
        prec.left(1, seq($._expr, "==", $._expr)),
        prec.left(1, seq($._expr, "&&", $._expr)),
        prec.left(1, seq($._expr, "||", $._expr)),
        prec.left(1, seq($._expr, "+", $._expr)),
        prec.left(1, seq($._expr, "-", $._expr)),
        prec.left(1, seq($._expr, "|>", $._expr)),
        prec.left(1, seq($._expr, ">>", $._expr)),
        prec.left(1, seq($._expr, "<|", $._expr)),
        prec.left(1, seq($._expr, "<<", $._expr)),
      ),
    if_expr: ($) => seq("if", $._expr, "then", $._expr, "else", $._expr),
    application: ($) => seq($._term, repeat1($._term)),

    _term: ($) =>
      choice(
        $.accessor,
        $.value_ident,
        $.number,
        seq("(", $._expr, ")"),
        $.list,
      ),
    accessor: ($) => seq($.module_name, ".", $.value_ident),
    list: ($) =>
      seq(
        "[",
        choice(
          "]",
          seq(
            choice(
              $._expr,
              seq(repeat1(seq($._expr, ",")), $._expr, optional(",")),
            ),
            "]",
          ),
        ),
      ),
    number: ($) => new RustRegex("-?[0-9]+"),

    _statement: ($) => choice($.import, $.type_def, $.signature, $.value_def),

    import: ($) => seq("import", $.module_name, ";"),

    type_def: ($) => seq("let", $.type_ident, "=", $._type, ";"),

    signature: ($) => seq("let", $.value_ident, ":", $._type, ";"),
    value_def: ($) => seq("let", $.value_ident, "=", $._expr, ";"),
  },
});
