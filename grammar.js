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
    module_decl: ($) =>
      seq(
        "module",
        $.module_name,
        "[",
        choice(
          seq($._export, repeat(seq(",", $._export))),
          optional($._export),
        ),
        "];",
      ),
    module_name: ($) => pascal_case,
    _export: ($) => choice($.value_ident, $.type_ident),
    type_ident: ($) => pascal_case,
    constructor_ident: ($) => pascal_case,
    value_ident: ($) => seq(snake_case, optional("?")),

    _type: ($) =>
      choice(
        seq("(", $._type, ")"),
        $.function_type,
        $.primative_type,
        $.type_constructor,
        $.type_param,
      ),
    function_type: ($) => prec.right(seq($._type, "->", $._type)),
    primative_type: ($) => choice("Bool", "Int", "String", "()"),

    sum_type: ($) => repeat1(seq("|", $.value_constructor)),
    type_param: ($) => snake_case,
    type_constructor: ($) => seq($.type_ident, repeat($._type_arg)),
    value_constructor: ($) => seq($.constructor_ident, repeat($._type_arg)),
    _type_arg: ($) =>
      choice($.type_param, $.primative_type, seq("(", $._type, ")")),

    _expr: ($) =>
      choice(
        $.if_expr,
        $.when_expr,
        $.let_expr,
        $.lambda,
        $.crash_expr,
        $.string,
        $.binary_expr,
        $.unary_expr,
        $.application,
        $._term,
      ),
    crash_expr: ($) => seq("crash", $.string),
    string: ($) => seq('"', new RustRegex('[^"]*'), '"'),
    unary_expr: ($) => prec(2, choice(seq("-", $._expr), seq("!", $._expr))),
    binary_expr: ($) =>
      choice(
        prec.left(1, seq($._expr, "==", $._expr)),
        prec.left(1, seq($._expr, "::", $._expr)),
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
    when_expr: ($) => seq("when", $._expr, "is", repeat($.alternative), ";"),
    alternative: ($) => seq("|", $._pattern, "->", $._expr),
    let_expr: ($) => seq("let", $._pattern, "=", $._expr, ";", $._expr),
    lambda: ($) => seq("\\", repeat1($._pattern), "->", $._expr),
    application: ($) => seq($._term, repeat1($._term)),

    _pattern: ($) => choice($.wildcard, $.value_ident, $.empty_list, $.cons),
    empty_list: ($) => "[]",
    wildcard: ($) => "_",
    cons: ($) => prec.right(seq($._pattern, "::", $._pattern)),

    _term: ($) =>
      choice(
        $.accessor,
        $.value_ident,
        $.constructor_ident,
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

    type_def: ($) =>
      seq(
        "let",
        $.type_constructor,
        "=",
        choice($.value_constructor, $.sum_type),
        ";",
      ),

    signature: ($) => seq("let", $.value_ident, ":", $._type, ";"),
    value_def: ($) =>
      seq("let", $.value_ident, repeat($._pattern), "=", $._expr, ";"),
  },
});
