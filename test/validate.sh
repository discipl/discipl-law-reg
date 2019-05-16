#!/usr/bin/env bash

if [ ! -f "$1" ]; then
    echo "Pass file to validate as first argument"
    exit 1
fi

grep -o -P -e "\[.*?\]" "$1" | grep -P -v -e "\[[0-9]+\]" | grep -v -e "jjjjmmdd" |  sort -u > ./used-facts
cat "$1" | jq ".facts[].fact" | sed 's/"//g' | sort > ./defined-facts
echo "Facts that are used but not defined"
diff --new-line-format="" --unchanged-line-format="" used-facts defined-facts

grep -o -P -e "<<.*?>>" "$1" | sort -u > ./used-acts
cat "$1" | jq ".acts[].act" | sed 's/"//g' | sort > ./defined-acts
echo "Acts that are used but not defined"
diff --new-line-format="" --unchanged-line-format="" used-acts defined-acts

grep -o -P -e "<.*?>" "$1" | grep -v "<<" |  sort -u > ./used-duties
cat "$1" | jq ".duties[].duty" | sed 's/"//g' | sort > ./defined-duties
echo "Duties that are used but not defined"
diff --new-line-format="" --unchanged-line-format="" used-duties defined-duties

