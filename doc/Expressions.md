# Expressions

This documentation gives a in depth explanation in how to define and use expressions within a FLINT model.

## Usage

Expressions can be used within the  `preConditions`  property of **acts** and the `function` property of **facts**. Within `preConditions` the expressions determines if action can be taken by an actor. If the expressions evaluates to _false_, taking this action is not allowed. Within the `function` property of a fact, the evaluation of the expression will be the eventual value of the fact.

A expression is defined by an object with the type of the expression and one or more operands.

```json
{
    "expression": "LITERAL",
    "operand": "Discipl"
}
{
    "expression": "AND",
    "operands": [
        "[some fact]",
        "[another fact]"
    ]
}
```

The value of a operand can be a reference to a fact, another expression or sometimes a static value. This makes them extremely powerful and gives the ability to create complex nested expressions with references to other facts with there own expressions.

## Expressions

The following paragraph lists all available expressions divided into the categories: mathematical; boolean logic; special.

### Mathematical

All expressions in this category work with literal values and can be used to perform mathematical operations. The intention for these expressions is to use them with numeric values. Other types of literals are not officially supported.

#### SUM

The `SUM` expression takes multiple numeric values as operands and calculates the sum. It accepts either fact references or direct [`LITERAL`](#literal) expressions. If one of the operands is `undefined`,  the result of the expression will be `undefined` too.

> During evaluation the [unary plus operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unary_plus) is used when non-numeric values are given as operand. An expression with 'ab' and 'cd' as operands will thus evaluate into the string 'abcd'.

```json
{
    "fact": "[aantal kinderen]",
    "function": {
        "expression": "SUM",
        "operands": [
            {
                "expression": "LITERAL",
                "operand": 2
            },
            "[one]", // Reference to a fact with the LITERAL value 1
        ]
    }
}
```

#### PRODUCT

The `PRODUCT` expression takes multiple numeric operands as values and returns the product of all values. It accepts either fact references or direct [`LITERAL`](#literal) expressions. If one of the operands is `undefined` , the result of the expression will be `undefined` too.

> during evaluation the [multiplication operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Multiplication) is used when non-numeric values are given as operand. An expression with 'ab' and 'cd' as operands will thus evaluate to `NaN`.

```json
{
    "fact": "[prijs inclusief btw]",
    "function": {
        "expression": "PRODUCT",
        "operands": [
            {
                "expression": "LITERAL",
                "operand": 100
            },
            "[algemeen btw tarief]" // Reference to a fact with  the LITERAL value 0.21
        ]
    }
}
```

#### MIN

The `MIN` expression takes multiple numeric values as operands and returns the smallest value.  It accepts either fact references or direct [`LITERAL`](#literal) expressions. If one of the operands is `undefined` , the result of the expression will be `undefined` too.

> During evaluation the [less than operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Less_than) is used. An expression non-numeric values like 'ab' and 'cd' as operands will thus evaluate into the string 'ab'.

```json
{
    "fact": "[laagste inkomen]",
    "function": {
        "expression": "MIN",
        "operands": [
            {
                "expression": "LITERAL",
                "operand": 2200
            },
            "[inkomen van duizend euro]" // Reference to a fact with the LITERAL value 3000
        ]
    }
}
```

#### MAX

The `MAX` expression takes multiple numeric values as operands and return biggest value. It accepts either fact references or direct [`LITERAL`](#literal) expressions. If one of the operands is `undefined` , the result of the expression will be `undefined` too.

> During evaluation the [greather than](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Greater_than) is used. An expression containing non numeric values like 'ab' and 'cd' as operands will thus evaluate into the string 'cd'.

```json
{
    "fact": "[hoogste inkomen]",
    "function": {
        "expression": "MAX",
        "operands": [
            {
                "expression": "LITERAL",
                "operand": 2200
            },
            "[inkomen van duizend euro]" // Reference to a fact with the LITERAL value 3000
        ]
    }
}
```

### Boolean logic

Expressions in this category will evaluate into a `boolean` value.  

#### EQUAL

The `EQUAL` expression takes multiple operands and evaluates to `true` if all operands are **strict equal** to each other. It accepts either fact references or direct [`LITERAL`](#literal) expressions.

```json
{
    "fact": "[heeft twee kinderen]",
    "function": {
        "expression": "EQUAL",
        "operands": [
            "[aantal kinderen]", // Reference to a fact with the LITERAL value 2
            {
                "expression": "LITERAL",
                "operand": 2
            }
        ]
    }
}
```

#### LESS_THAN

The `LESS_THAN` expression takes multiple operands evaluates `true` if the first operand is smaller than the second operand. If more than two operands are given is evaluates to `true` if all given operands are in acceding order.  It accepts either fact references or direct [`LITERAL`](#literal) expressions.

> During evaluation the [less than operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Less_than) is used. An expression containing non-numeric values like 'ab' and 'cd' as operands will thus evaluate into `true`.

```json
{
    "fact": "[inkomen lager dan twintigduizen]",
    "function": {
        "expression": "LESS_THAN",
        "operands": [
            "[inkomen]", // Reference to a fact with the LITERAL value 18000
            {
                "expression": "LITERAL",
                "operand": 20000
            }
        ]
    }
}
```

#### AND

The `AND` expression takes multiple operands and evaluates to `true` if none of the given operand evaluates **strict equal** to `false`. This expression can be used to check if a list of facts exists. It accepts either fact references or direct [`LITERAL`](#literal) expressions.

> During evaluation the [strict equality operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality) is used to check if none of the operands is `false`. An expression containing the operands `["string", 0, true]` will thus evaluate to `true`

```json
{
    "fact": "[aan alle voorwaarden is voldaan]",
    "function": {
        "expression": "AND",
        "operands": [
            "[heeft een tijdelijk contract]",
            "[ontvangt geen uitkering]"
        ]
    }
}
```

#### OR

The `OR` expression takes multiple operands and evaluates to `true` if at least one of the given operands also evaluates **strict equal** to `true`. This expression can be used to check if out of list of facts at least one fact exists.

> During evaluation the [strict equality operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality) is used to check if at least on of the facts is `true`. An expression containing the operands `["string", 0, true]` will thus evaluate to `true`

```json
{
    "fact": "[voldoent aan tenminste een voorwaarde]",
    "function": {
        "expression": "OR",
        "operands": [
            "[heeft een tijdelijk contract]",
            "[heeft geen inkomen]"
        ]
    }
}
```

#### NOT

The `NOT` expression takes one operand and evaluates to `true` if the given operand is `false` . If the given operand is not a boolean value the result of the evaluation will be `undefined`.

```json
{
    "fact": "[woonachtig in Nederland]",
    "function": {
        "expression": "NOT",
        "operand": "[woonachtig in het buitenland]"
    }
}
```

### Special

#### LITERAL

The `LITERAL` expression has one operand that holds a static value of a [primitive type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Primitive_values) supported by JavaScript. It is often used as fact function and can serve as operand for [mathematical](#mathematical) expressions.

> JavaScript has some natural problems with big numbers and floating points. To overcome some of this issues, numbers are handled by [big.js](https://github.com/MikeMcl/big.js/).

```json
{
    "fact": "[bruto inkomen op jaarbasis]",
    "function": {
        "expression": "LITERAL",
        "operand": 38000
    }
}
```

#### LIST

#### CREATE

The `CREATE` expression does not accept any operands and can only be used on facts. It ensures that a given facts is the result of an action and not defined elsewhere.

```json
{
    "acts": [
        {
            "act": "<<kinderbijslag aanvragen>>",
            "actor": "[ouder]",
            "recipent": "[minister]",
            "create": [
                "[aanvraag]"
            ]
        }
    ],
    "facts": [
        {
            "fact": "[aanvraag]",
            "function": "CREATE"
        }
    ]
}
```

## Examples

### Nested expression

### Working with lists

### Fact references

