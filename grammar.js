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
  choice(seq(rule, repeat(seq(",", rule))), optional(rule));

module.exports = grammar({
  name: "pac",

  rules: {
    source_file: ($) => seq($.module_decl, repeat($._statement)),
    module_decl: ($) => seq("module", $.module_name, $.exports, ";"),
    module_name: ($) => pascal_case,
    exports: ($) => seq("[", comma_seperated($._export), "]"),
    _export: ($) => choice($.value_ident, $.type_ident),

    type_ident: ($) => pascal_case,
    constructor_ident: ($) => pascal_case,
    value_ident: ($) => seq(snake_case, optional("?")),

    _type: ($) => choice($.function_type, $.type_constructor, $._type_term),
    _type_term: ($) =>
      choice(
        $.type_param,
        $.primative_type,
        $.record_type,
        seq("(", $._type, ")"),
      ),
    type_constructor: ($) => seq($.type_ident, repeat($._type_term)),
    record_type: ($) => seq("{", comma_seperated($.field_type), "}"),
    field_type: ($) => seq($.value_ident, ":", $._type),
    function_type: ($) => prec.right(seq($._type, "->", $._type)),
    primative_type: ($) =>
      choice("Bool", "Int", "Float", "Nat", "String", "()"),

    type_param: ($) => snake_case,
    _type_arg: ($) =>
      choice($.type_param, $.primative_type, seq("(", $._type, ")")),

    _expr: ($) =>
      choice(
        $.if_expr,
        $.when_expr,
        $.let_expr,
        $.lambda,
        $.crash_expr,
        $.extern_expr,
        $.string,
        $.binary_expr,
        $.unary_expr,
        $.application,
        $._term,
      ),
    crash_expr: ($) => seq("crash", $.string),
    extern_expr: ($) => seq("extern", $.string),
    string: ($) => new RustRegex('"[^"]*"'),
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
        $.list,
        seq("(", $._expr, ")"),
      ),
    accessor: ($) => seq($.module_name, ".", $.value_ident),
    list: ($) => seq("[", comma_seperated($._expr), "]"),
    number: ($) => new RustRegex("-?[0-9]+"),

    _statement: ($) => choice($.import, $.type_def, $.signature, $.value_def),

    import: ($) => seq("import", $.module_name, ";"),

    type_def: ($) =>
      seq(
        "let",
        $.type_def_constructor,
        "=",
        choice($.value_constructor, $.sum_type, $.extern_type),
        ";",
      ),
    extern_type: ($) => seq("extern", $.string),
    sum_type: ($) => repeat1(seq("|", $.value_constructor)),
    type_def_constructor: ($) => seq($.type_ident, repeat($._type_arg)),
    value_constructor: ($) => seq($.constructor_ident, repeat($._type_arg)),

    signature: ($) => seq("let", $.value_ident, ":", $._type, ";"),

    value_def: ($) =>
      seq("let", $.value_ident, repeat($._pattern), "=", $._expr, ";"),
  },
});
