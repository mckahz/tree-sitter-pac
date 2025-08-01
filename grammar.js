/**
 * @file A parser for the Pixel Art Console language
 * @author mckahz <fletchusmaximus@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  COMMENT: 1,
  STRING: 2,
  OPERATOR: 2,
};

const pascal_case = new RustRegex("[A-Z]+[a-zA-Z]*");
const snake_case = new RustRegex("[a-z_]+[a-z0-9_]*");
const comma_seperated = (rule) =>
  choice(seq(rule, repeat(seq(",", rule))), optional(rule));

module.exports = grammar({
  name: "pac",

  rules: {
    source_file: ($) => seq($.module_declaration, repeat($._statement)),

    type_identifier: ($) => pascal_case,
    constructor_identifier: ($) => pascal_case,
    value_identifier: ($) => seq(snake_case, optional("?")),
    module_identifier: ($) => pascal_case,
    type_parameter: ($) => snake_case,

    module_declaration: ($) =>
      seq("module", $.module_identifier, $._exports, ";"),
    _exports: ($) => seq("[", comma_seperated($.export), "]"),
    export: ($) => choice($.value_identifier, $.type_identifier),

    _type: ($) => seq($._type_term, repeat(seq("->", $._type_term))),
    _type_term: ($) => choice($.type_constructor, $._type_factor),
    _type_factor: ($) =>
      choice(
        $.type_parameter,
        $.type_identifier,
        $.record_type,
        seq("(", $._type, ")"),
      ),
    type_constructor: ($) => seq($.type_identifier, repeat1($._type_factor)),
    record_type: ($) => seq("{", comma_seperated($.field_type), "}"),
    field_type: ($) => seq($.value_identifier, ":", $._type),

    _expr: ($) =>
      choice(
        $.if_expr,
        $.when_expr,
        $.let_expr,
        $.lambda,
        $.crash_expr,
        $.extern_expr,
        $.binary_expr,
        $.unary_expr,
        $.application,
        $._term,
      ),
    crash_expr: ($) => seq("crash", $.string_literal),
    extern_expr: ($) => seq("extern", $.string_literal),

    string_escape: ($) => /\\(u\{[0-9A-Fa-f]{4,6}\}|[nrt\"'\\])/,
    invalid_string_escape: ($) => /\\(u\{[^}]*\}|[^nrt\"'\\])/,

    _string_multiline: ($) =>
      seq(
        alias('"""', $.open_quote),
        repeat(
          choice(
            alias(
              token.immediate(
                prec(PREC.STRING, repeat1(choice(/[^\\"]/, /"[^"]/, /""[^"]/))),
              ),
              $.regular_string_part,
            ),
            $.string_escape,
            $.invalid_string_escape,
          ),
        ),
        alias('"""', $.close_quote),
      ),
    _string_single_line: ($) =>
      seq(
        alias('"', $.open_quote),
        repeat(
          choice(
            alias(
              token.immediate(prec(PREC.STRING, repeat1(/[^\\"\n]/))),
              $.regular_string_part,
            ),
            $.string_escape,
            $.invalid_string_escape,
          ),
        ),
        alias('"', $.close_quote),
      ),
    string_literal: ($) => choice($._string_multiline, $._string_single_line),

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

    _pattern: ($) =>
      choice(
        $.cons,
        $.constructor_identifier,
        seq("(", $.constructor, ")"),
        $.wildcard,
        $.value_identifier,
        $.empty_list,
      ),
    constructor: ($) => seq($.constructor_identifier, repeat($._pattern)),
    empty_list: ($) => "[]",
    wildcard: ($) => "_",
    cons: ($) => prec.right(seq($._pattern, "::", $._pattern)),

    _term: ($) =>
      choice(
        $.string_literal,
        $.accessor,
        $.value_identifier,
        $.constructor_identifier,
        $.number,
        $.list,
        seq("(", $._expr, ")"),
      ),
    accessor: ($) => seq($.module_identifier, ".", $.value_identifier),
    list: ($) => seq("[", comma_seperated($._expr), "]"),
    number: ($) => new RustRegex("-?[0-9]+"),

    _statement: ($) => choice($.import, $.type_def, $.signature, $.value_def),

    import: ($) => seq("import", $.module_identifier, ";"),

    type_def: ($) =>
      seq(
        "let",
        $.type_def_constructor,
        "=",
        choice($.value_constructor, $.sum_type, $.extern_type),
        ";",
      ),
    extern_type: ($) => seq("extern", $.string_literal),
    sum_type: ($) => repeat1(seq("|", $.value_constructor)),

    _type_arg: ($) =>
      choice($.type_parameter, $.type_identifier, seq("(", $._type, ")")),
    type_def_constructor: ($) => seq($.type_identifier, repeat($._type_arg)),
    value_constructor: ($) =>
      seq($.constructor_identifier, repeat($._type_arg)),

    signature: ($) => seq("let", $.value_identifier, ":", $._type, ";"),

    value_def: ($) =>
      seq("let", $.value_identifier, repeat($._pattern), "=", $._expr, ";"),
  },
});
