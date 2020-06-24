# FLINT models

This documentation is a developer reference to create FLINT data models in JSON-LD format. Please see the [flinteditor-mps](https://github.com/discipl/flinteditor-mps) for more end-user oriented way to build FLINT models.

## Model definition

A FLINT model is a JSON-LD representation of a process. It describes actions that actors can (or must) take, conditions that must be fulfilled in order to take an action and contains official jurisdictional references to law and regulation texts. Each part of the model is saved as a verifiable claim and actions that are taken on the model will be expressed in new claims. The discipl-law-reg API can be used to play a certain role in the defined process and can perform actions as a certain actor.

A basic FLINT model is a JSON object that consists out of four properties:

1. `model` - A unique description that describes the processes that is modeled by the FLINT model
2. `acts` - An array of **actions** that may be taken during evaluation of the process
3. `facts` - An array of **facts** that can be referenced within the model
4. `duty` - An array of **duties** that can describe agreements between actors and enforce certain actions when this duty is broken

### Model

The `model` property contains a description that describes the processes that is modeled by the FLINT model.


```json
{
    "model": "Fictieve kinderbijslag"
}
```
### Acts (actions)

The `acts` property contains an array of actions that may be **taken** during the process. An act is defined by an object that describes among others: the actor that will take the action; the recipient that receives the result; the conditions that must be met in order to take the act.

> On the implementation level the `recipient` expresses a need (with help of the [discipl-abundance-service](https://github.com/discipl/discipl-abundance-service/)) and the `actor` attends to this need in order to fulfill it. So the actors in the model are referring to entities in the abundance service.

An act consists out of the following properties:

- `act` - A unique sentence that describes the act and is used to reference the action within the model. This sentence is usually enclosed between `<<` and `>>` to indicate that the sentence is referring to an act.
- `actions` - One or few words denoting what action is done on the object.
- `actor` - A reference to a fact that defines the actor that can take this action.
- `recipient` - A reference to a fact that defines the recipient of the result of this action.
- `object` - The object on which the action is executed by the actor, and that is needed by the recipient of this action. The object can be a entity or agent or a reference to such via a fact.
- `preconditions` - Boolean logic with references to other facts defined in the model. The evaluation of this expression determents if the actions can be taken or not.
- `create` - An array of references to other acts, facts and/or duties that will follow out of this action. The creation of a fact out of a action can be enforced by defining that fact with a `CREATE` expression as function.
- `terminate` - An array of references to other actions, facts and/or duties that will be terminated (eg. revoked) by taking this action.
- `sources` -  An array that contains jurisdictional references to the law/regulation this action is implied from.

```json
{
    "act": "<<kinderbijslag aanvragen>>",
    "actor": "[ouder]",
    "action": "[aanvraag indienen]",
    "object": "[verzoek]",
    "recipient": "[minister]",
    "preconditions": {
        "expression": "AND",
        "operands": [
            "[ouder heeft kinderen]"
        ]
    },
    "create": [
        "[aanvraag]"
    ],
    "terminate": [],
    "sources": [
        {
            "validFrom": "27-03-2020",
            "validTo": "31-05-2020",
            "citation": "bron",
            "juriconnect": "",
            "text": "Omschrijvende tekst"
        }
    ]
}
```
<details>
<summary>Example with previous steps</summary>

```json
{
    "model": "Fictieve kinderbijslag",
    "acts": [
        {
            "act": "<<kinderbijslag aanvragen>>",
            "actor": "[ouder]",
            "action": "[aanvraag indienen]",
            "object": "[verzoek]",
            "recipient": "[minister]",
            "preconditions": {
                "expression": "AND",
                "operands": [
                    "[ouder heeft kinderen]"
                ]
            },
            "create": [
                "[aanvraag]"
            ],
            "terminate": [],
            "sources": [
                {
                    "validFrom": "27-03-2020",
                    "validTo": "31-05-2020",
                    "citation": "bron",
                    "juriconnect": "",
                    "text": "Omschrijvende tekst"
                }
            ]
        },
        {
            "act": "<<klacht indienen>>",
            "action": "[klacht indienen]",
            "object": "[besluit]",
            "actor": "[ouder]",
            "recipient": "[minister]",
            "create": [
                "[bezwaarschrift]"
            ],
            "terminates": "",
             "sources": []
        },
        {
            "act": "<<aanvraag kinderbijslag toekennen>>",
            "actor": "[minister]",
            "action": "[besluit nemen]",
            "object": "[aanvraag]",
            "create": [
                "[besluit]"
            ],
            "recipient": "[ouder]",
             "sources": []
        },
        {
            "act": "<<aanvraag kinderbijslag afwijzen>>",
            "actor": "[minister]",
            "action": "[besluit nemen]",
            "object": "[aanvraag]",
            "recipient": "[ouder]",
            "create": [
                "[besluit]"
            ],
            "terminates": [
                "[aanvraag]"
            ],
             "sources": []
        }
    ]
}
```
</details>

### Facts

The `facts` property contains an array of **facts** that are referenced within the model. Facts can be evaluated at any time and can contain an expression or a reference to another fact.

A fact consists out of the following properties:

- `fact` - A unique text that identifies the fact and is used to refer to within the model. Usually this text is enclosed with `[` and `]` to indicate that the text is referring to a fact.
- `function` - The function that will evaluate to the eventual value of the fact, this can be a boolean expression or a reference to another fact. The value `[]` indicates that no function is given, in that case the application will fall back to the previous fact and eventually to the custom fact resolver (if given).. A function is evaluated when the fact is referenced in an action that is being taken. The result of the evaluation is logged as verifiable claim if the same result was not logged previously. When the fact is terminated, all those claims will be revoked.
- `sources` -  A object that contains jurisdictional references to the law/regulation this fact is implied from.

```json
{
    "fact": "[verzoek]",
    "function": { "expression": "CREATE" },
    "sources": []
}
```

<details>
<summary>Example with previous steps</summary>

```json
{
    "model": "Fictieve kinderbijslag",
    "acts": [
        {
            "act": "<<kinderbijslag aanvragen>>",
            "actor": "[ouder]",
            "action": "[aanvraag indienen]",
            "object": "[verzoek]",
            "recipient": "[minister]",
            "preconditions": {
                "expression": "AND",
                "operands": [
                    "[ouder heeft kinderen]"
                ]
            },
            "create": [
                "[aanvraag]"
            ],
            "terminate": [],
            "sources": [
                {
                    "validFrom": "27-03-2020",
                    "validTo": "31-05-2020",
                    "citation": "bron",
                    "juriconnect": "",
                    "text": "Omschrijvende tekst"
                }
            ]
        },
        {
            "act": "<<klacht indienen>>",
            "action": "[klacht indienen]",
            "object": "[besluit]",
            "actor": "[ouder]",
            "recipient": "[minister]",
            "create": [
                "[bezwaarschrift]"
            ],
            "terminates": "",
            "sources": []
        },
        {
            "act": "<<aanvraag kinderbijslag toekennen>>",
            "actor": "[minister]",
            "action": "[besluit nemen]",
            "object": "[aanvraag]",
            "create": [
                "[besluit]"
            ],
            "recipient": "[ouder]",
            "sources": []
        },
        {
            "act": "<<aanvraag kinderbijslag afwijzen>>",
            "actor": "[minister]",
            "action": "[besluit nemen]",
            "object": "[aanvraag]",
            "recipient": "[ouder]",
            "create": [
                "[besluit]"
            ],
            "terminates": [
                "[aanvraag]"
            ],
            "sources": []
        }
    ],
    "facts": [
         {
            "fact": "[ouder]",
            "function": "[]",
            "sources": []
        },
        {
            "fact": "[minister]",
            "function": "[]",
            "sources": []
        },
        {
            "fact": "[verzoek]",
            "function": "[]",
            "sources": []
        },
        {
            "fact": "[ouder heeft kinderen]",
            "function": "[]",
            "sources": []
        },
        {
            "fact": "[aanvraag]",
            "function": {
                "expression": "CREATE"
            },
            "sources": []
        },
        {
            "fact": "[besluit]",
            "function": {
                "expression": "CREATE"
            },
            "sources": []
        },
        {
            "fact": "[bezwaarschrift]",
            "function": {
                "expression": "CREATE"
            },
            "sources": []
        }
    ]
}
```
</details>

### Duties

The `duties` property contains an array of **duty** objects. A duty describes an agreement between two actors and refers to **acts** that will be taken if either  the duty is broken or fulfilled. On this moment duties are not enforced by the discipl-law-reg API.

> On the implementation level a duty represents a need expressed by the `claiment` that will be fulfilled by the `duty-holder`

A duty consists of the following properties:

- `duty` - A unique sentence that describes the duty and is used to reference it within the model. This sentence is usually enclosed between `<` and `>` to indicate that the sentence is referring to an duty.
- `duty-holder` - A reference to a fact that defines the actor that is obligated to take an action.
- `claiment` - A reference to a fact that defines the actor that is obligating the accountable (the `duty-holder`) to take an action.
- `create` - An actions that creates the duty for the accountable.
- `terminate` - An actions that will be terminated by the duty.
- `enforce` - An actions that can be taken by the `claiment` if the accountable (`duty-holder`) is not complying to the duty.

```json
{
    "duty": "<besluit berust op deugdelijke motivering>",
    "duty-holder": "[minister]",
    "claimant": "[ouder]",
    "create": "<<kinderbijslag aanvragen>>",
    "enforce": "<<klacht indienen>>",
    "terminate": ""
}
```

<details>
<summary>Example with previous steps</summary>

```json
{
    "model": "Fictieve kinderbijslag",
    "acts": [
        {
            "act": "<<kinderbijslag aanvragen>>",
            "actor": "[ouder]",
            "action": "[aanvraag indienen]",
            "object": "[verzoek]",
            "recipient": "[minister]",
            "preconditions": {
                "expression": "AND",
                "operands": [
                    "[ouder heeft kinderen]"
                ]
            },
            "create": [
                "[aanvraag]"
            ],
            "terminate": [],
            "sources": [
                {
                    "validFrom": "27-03-2020",
                    "validTo": "31-05-2020",
                    "citation": "bron",
                    "juriconnect": "",
                    "text": "Omschrijvende tekst"
                }
            ]
        },
        {
            "act": "<<klacht indienen>>",
            "action": "[klacht indienen]",
            "object": "[besluit]",
            "actor": "[ouder]",
            "recipient": "[minister]",
            "create": [
                "[bezwaarschrift]"
            ],
            "terminates": "",
            "sources": []
        },
        {
            "act": "<<aanvraag kinderbijslag toekennen>>",
            "actor": "[minister]",
            "action": "[besluit nemen]",
            "object": "[aanvraag]",
            "create": [
                "[besluit]"
            ],
            "recipient": "[ouder]",
            "sources": []
        },
        {
            "act": "<<aanvraag kinderbijslag afwijzen>>",
            "actor": "[minister]",
            "action": "[besluit nemen]",
            "object": "[aanvraag]",
            "recipient": "[ouder]",
            "create": [
                "[besluit]"
            ],
            "terminates": [
                "[aanvraag]"
            ],
            "sources": []
        }
    ],
    "facts": [
         {
            "fact": "[ouder]",
            "function": "[]",
            "sources": []
        },
        {
            "fact": "[minister]",
            "function": "[]",
            "sources": []
        },
        {
            "fact": "[verzoek]",
            "function": "[]",
            "sources": []
        },
        {
            "fact": "[ouder heeft kinderen]",
            "function": "[]",
            "sources": []
        },
        {
            "fact": "[aanvraag]",
            "function": {
                "expression": "CREATE"
            },
            "sources": []
        },
        {
            "fact": "[besluit]",
            "function": {
                "expression": "CREATE"
            },
            "sources": []
        },
        {
            "fact": "[bezwaarschrift]",
            "function": {
                "expression": "CREATE"
            },
            "sources": []
        }
    ],
    "duties": [
        {
            "duty": "<besluit berust op deugdelijke motivering>",
            "duty-holder": "[minister]",
            "claimant": "[ouder]",
            "create": "<<kinderbijslag aanvragen>>",
            "enforce": "<<klacht indienen>>",
            "terminate": ""
        }
    ]
}
```
</details>

