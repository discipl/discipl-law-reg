#!/bin/bash
cat "$1"  | jq -r '.acts | [ "act", "actor", "action", "object", "interested-party", "preconditions", "create", "terminate", "version", "reference", "juriconnect", "sourcetext", "explanation" ] as $cols | map(. as $row | $cols | map($row[.])) as $rows | $cols, $rows[] | @csv' > acts.csv
cat "$1"  | jq -r '.facts | [ "fact", "function", "version", "reference", "juriconnect", "sourcetext", "explanation" ] as $cols | map(. as $row | $cols | map($row[.])) as $rows | $cols, $rows[] | @csv' > facts.csv
cat "$1"  | jq -r '.duties | [ "duty", "duty-components", "duty-holder", "claimant", "create", "terminate", "version", "reference", "juriconnect", "sourcetext", "explanation" ] as $cols | map(. as $row | $cols | map($row[.])) as $rows | $cols, $rows[] | @csv' > duties.csv
