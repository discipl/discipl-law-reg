# Expressions

This documentation gives a in depth explanation in how to define and use expressions within FLINT models.

## Usage

Expressions can be used within the  `preConditions`  property of **acts** and the `function` property of **facts**. Within `preConditions` the expressions determines if an action can be taken by an actor. If the expressions evaluates to `false`, taking this action is not allowed. Within the `function` property of a fact, the evaluation of the expression will be the eventual value of the fact.

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

The value of a operand can be a reference to a fact, another expression or sometimes a static value. This makes them extremely powerful and gives the ability to create complex [nested expressions](#nested-expressions) with references to other facts with there own expressions.

## Expressions

The following paragraph lists all available expressions divided into the categories: basic; mathematical; boolean logic.

### Basic

#### LITERAL

The `LITERAL` expression has one operand that holds a static value of a [primitive type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Primitive_values) supported by JavaScript. It is often used as fact function and can serve as operand for other expressions.

> JavaScript has some natural problems with big numbers and floating points. To overcome some of this issues, numbers are handled by [big.js](https://github.com/MikeMcl/big.js/).

```json
{
    "fact": "[aantal maanden in een jaar]",
    "function": {
        "expression": "LITERAL",
        "operand": 12
    }
}
```

#### LIST

The `LIST` operator can be used to collect data during evaluation of a fact. The fact containing this list can be used as input for other expressions, for example `SUM`.

The `LIST` expression has a somewhat different syntax when compared to other expressions. It needs a unique `name` property for administrative purpose and a `items` property. The `items` property can be either a fact reference or another expressions.

```json
{
    "fact": "[totale oppervlakte]",
    "function": {
        "expression": "SUM",
        "operands": [
            {
                "expression": "LIST",
                "name": "perceel",
                "items": "[oppervlakte van het perceel]"
            }
        ]
    }
}
```

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

### Mathematical

All expressions in this category work with literal values and can be used to perform mathematical operations. The intention for these expressions is to use them with numeric values. Other types of literals are not officially supported.

#### SUM

The `SUM` expression takes multiple numeric values as operands and calculates the sum. If one of the operands is `undefined`,  the result of the expression will be `undefined` too.

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

The `PRODUCT` expression takes multiple numeric values as operand and returns the product of all values. If one of the operands is `undefined` , the result of the expression will be `undefined` too.

> During evaluation the [multiplication operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Multiplication) is used when non-numeric values are given as operand. An expression with 'ab' and 'cd' as operands will thus evaluate into `NaN`.

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

The `MIN` expression takes multiple numeric values as operand and returns the smallest value. If one of the operands is `undefined` , the result of the expression will be `undefined` too.

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

The `MAX` expression takes multiple numeric values as operands and returns the greatest value. If one of the operands is `undefined` , the result of the expression will be `undefined` too.

> During evaluation the [greather than](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Greater_than) is used. An expression containing non-numeric values like 'ab' and 'cd' as operands will thus evaluate into the string 'cd'.

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

The `EQUAL` expression takes multiple operands and evaluates to `true` if all operands are **strict equal** to each other.

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

The `LESS_THAN` expression takes multiple operands evaluates `true` if the first operand is smaller than the second operand. If more than two operands are given, it evaluates to `true` if all given operands are in acceding order.

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

The `AND` expression takes multiple operands and evaluates to `true` if none of the given operand evaluates **strict equal** to `false`.

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

The `OR` expression takes multiple operands and evaluates to `true` if at least one of the given operands also evaluates **strict equal** to `true`.

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

## Examples

### Nested expressions

The true power of expressions lies in the fact that these can be nested. For example, combining the `AND`, `OR`, `NOT` expressions makes it possible to define a fact with that only evaluates to true if various conditions are me.

```json
{
    "fact": "[leraar voldoet aan de subsidiecriteria]",
    "function": {
        "expression": "AND",
        "operands": [
			"[leraar die bij aanvang van het studiejaar waarvoor de subsidie bestemd de graad Bachelor mag voeren]",
          	"[leraar die op het moment van de subsidieaanvraag in dienst is bij een werkgever]",
            {
            	"expression": "OR",
                "operands": [
                  "[leraar werkt bij een of meer bekostigde onderwijsinstellingen]",
                  "[leraar werkt in een of meer orthopedagogisch-didactische centra]"
                ]
			},
            {
                "expression": "NOT",
                "operand": "[leraar is aangesteld als ambulant begeleider]"
            }
        ]
    }
}
```

Combining mathematical operations makes it possible to calculate a sum out of other calculations.

```json
{
    "fact": "[salaris]",
    "function": {
        "expression": "SUM",
        "operands": [
            "[bruto jaarsalaris]"
            {
                "expression": "PRODUCT",
                "operands": [
                    "[bruto jaarsalaris]",
                    "[wettelijk percentage vakantiebijslag]"
                ]
            }
        ]
    }
}
```

