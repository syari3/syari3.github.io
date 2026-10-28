function tokenize(sentence) {

    return sentence
        .replace(/([.,!?])/g, " $1 ")
        .trim()
        .split(/\s+/)
        .filter(
            token =>
                ![".", ",", "?", "!"].includes(token)
        );

}

const auxiliaries = [
    "uhu",
    "newa",
    "soso",
    "tsero",
    "hus",
    "nyola",
    "ula",
    "hona"
];

const prepositions = [
    "kak",
    "rosha",
    "wik",
    "yus",
    "siha"
];

const numberWords = {
    "yu": 1,
    "ryu": 2,
    "yori": 5,
    "ware": 20,
    "ri": 100
};

function parsePredicateList(words) {

    const list = [];

    let start = 0;


    for (let i = 0; i <= words.length; i++) {


        if (
            i === words.length ||
            words[i].text === "gu" ||
            words[i].text === "shea"
        ) {

            const part =
                words.slice(start, i);


            list.push(
                parsePredicatePart(part)
            );


            start = i + 1;

        }

    }


    return list;
}
function parsePredicatePart(words) {

    const shaIndex =
        words.findIndex(
            t => t.text === "sha"
        );


    // shaなし
    if (shaIndex === -1) {

        return {

            predicate:
                parsePredicate(words)

        };

    }


    // shaあり
    const predicateWords =
        words.slice(0, shaIndex);


    const objectWords =
        words.slice(shaIndex + 1);



    return {

        predicate:
            parsePredicateWithObject(
                predicateWords
            ),

        objects:
            parseObjectList(
                objectWords
            )

    };

}
function parsePredicateWithObject(words) {

    if (words.length === 0) {
        throw new Error("目的語付き述語がありません。");
    }


    return {
        type: "Predicate",

        possibilities:
            parsePredicateCore(
                words,
                {
                    allowNonVerb: false
                }
            )
    };

}

/**
 * グレイシア語 簡易構文解析器
 * 対応文法:
 * A gu B
 * A gu B sha C提
 */

function parse(sentence){

    let tokens =
        tokenize(sentence);

    const shiResult =
        processShi(tokens);

    const gasoResult =
        processGaso(tokens);


    tokens =
        gasoResult.tokens;

    const questionResult =
        processYesNoQuestion(tokens);

    const woyaResult =
        processWoya(tokens);

    console.log(tokens)

    const isQuestion =
        questionResult.isQuestion;


    tokens =
        processLa(
            questionResult.tokens
        );

    if(shiResult.hasShi){


        const mainTokens =
            [
                ...shiResult.main,
                "shi"
            ];


        const mainResult =
            parse(
                mainTokens.join(" ")
            );


        const explanation =
            parse(
                shiResult.explanation.join(" ")
            );


        return {

            ...mainResult,

            shi:{

                type:"Explanation",

                content:
                    explanation

            }

        };

    }

    // shelyo処理
    const shelyoIndex =
        tokens.findIndex(
            t => t.text === "shelyo"
        );


    if (shelyoIndex !== -1) {

        return {

            type:
                isQuestion
                ? "Question"
                : "Shelyo",

            shelyo:
                parseShelyo(
                    tokens.slice(0, shelyoIndex),
                    tokens.slice(shelyoIndex + 1)
                )

        };

    }

    const markerIndex =
        tokens.findIndex(
            t =>
            t.text === "gu" ||
            t.text === "shea"
        );


    if(markerIndex === -1){

        return {

            type:"Fragment",

            possibilities:
                parsePredicate(tokens)

        };

    }


    const subjects =
        parseSubjectList(
            tokens.slice(0, markerIndex)
        );


    const predicateTokens =
        tokens.slice(markerIndex + 1);


    const predicates =
        parsePredicateList(
            predicateTokens
        );


    return {

        type:
            tokens[markerIndex].text === "shea"
            ? "Command"
            : isQuestion || woyaResult.isQuestion
            ? "Question"
            : "Sentence",


        questionType:
            woyaResult.isQuestion
            ? "Woya"
            : isQuestion
            ? "YesNo"
            : null,

        contrast:
            gasoResult.isContrast,


        subjects,

        predicates

    };
}

/**
 * la を処理する
 * ・区切り直後なら「0」として扱う
 * ・それ以外なら直前の単語を否定する
 */
function processLa(tokens) {
    const result = [];

    for (const token of tokens) {
        if (token !== "la") {
            result.push({
                text: token,
                negated: false
            });
            continue;
        }

        // 文頭、gu直後、sha直後なら0
        if (
            result.length === 0 ||
            result[result.length - 1].text === "gu" ||
            result[result.length - 1].text === "sha"
        ) {
            result.push({
                text: "la",
                meaning: "zero"
            });
        } else {
            result.push({
                text: "la"
            });
        }
    }

    return result;
}

// 述語全体の解析
function parsePredicate(words) {

   

    if(words.length === 0){

        return {
            type:"MissingPredicate"
        };

    }
    
    const elyuIndex =
        words.findIndex(
            t => t.text === "elyu"
        );

    if (elyuIndex !== -1) {

        return {

            type:"Or",

            left:
                parsePredicate(
                    words.slice(0,elyuIndex)
                ),

            right:
                parsePredicate(
                    words.slice(elyuIndex+1)
                )

        };

    }

    
    return {
        type:"Predicate",
        possibilities:
            parsePredicateCore(words)
    };

}


// 述語候補生成
function parsePredicateCore(words,options = {}) {

    const possibilities = [];


    if (words.length === 0) {
        return possibilities;
    }


    const first = words[0];


    // --------------------
    // 前置詞として解釈
    // --------------------

    if (prepositions.includes(first.text)) {

        possibilities.push({

            role: "PrepositionPredicate",

            phrase:
                parsePrepositionPhrase(words)

        });

    }


    // --------------------
    // 助動詞として解釈
    // --------------------

    if (auxiliaries.includes(first.text)) {

        const rest = words.slice(1);


        if (rest.length > 0) {

            const nextCandidates =
                parsePredicateCore(
                    rest,
                    options
                );


            for (const candidate of nextCandidates) {

                possibilities.push({

                    role:
                        "AuxiliaryPredicate",

                    auxiliary:
                        first,

                    predicate:
                        candidate

                });

            }

        }

    }


    // --------------------
    // 前置詞句を後ろに持つ場合
    // --------------------

    const split =
        splitPrepositionPhrase(words);


    if (split) {

        possibilities.push({

            role: "Verb",

            tree:
                parseModifier(
                    split.main
                ),

            adjunct:
                parsePrepositionPhrase(
                    split.preposition
                )

        });


    } else {


        // --------------------
        // 動詞解釈
        // --------------------

        possibilities.push({

            role: "Verb",

            tree:
                parseModifier(words)

        });

    }



    // --------------------
    // 非動詞解釈
    // shaがある時は禁止
    // --------------------

    if (options.allowNonVerb !== false) {

        const split = splitPrepositionPhrase(words);


        if (split) {

            possibilities.push({

                role:"NonVerbPredicate",

                tree:
                    parseNominal(
                        split.main
                    ),

                adjunct:
                    parsePrepositionPhrase(
                        split.preposition
                    )

            });

        } else {

            possibilities.push({

                role:"NonVerbPredicate",

                tree:
                    parseNominal(words)

            });

        }

    }


    return possibilities;

}



// 前置詞句
function parsePrepositionPhrase(words) {

    const prep = words[0];

    const object =
        parseNounPhrase(
            words.slice(1)
        );


    return {

        type: "PrepositionalPhrase",

        preposition: prep,

        object: object

    };

}

// 前置詞分割
function splitPrepositionPhrase(words) {

    for (let i = 1; i < words.length; i++) {

        if (prepositions.includes(words[i].text)) {

            return {
                main: words.slice(0, i),

                preposition:
                    words.slice(i)
            };

        }

    }

    return null;
}

//名詞句解析
function parseNounPhrase(words) {

    


    const split =
        splitPrepositionPhrase(words);

    const elyuIndex =
        words.findIndex(
            t => t.text === "elyu"
        );
    
    if (elyuIndex !== -1) {
    
            return {
    
                type:"Or",
    
                left:
                    parseNounPhrase(
                        words.slice(0,elyuIndex)
                    ),
    
                right:
                    parseNounPhrase(
                        words.slice(elyuIndex+1)
                    )
    
            };
    
        }
    
    if (split) {

        return {

            type:"NounPhrase",

            head: {
                possibilities:
                    parseNominal(
                        split.main
                     ),
            },

            preposition:
                parsePrepositionPhrase(
                    split.preposition
                )

        };

    }

    


    return {

        type:"NounPhrase",

        head:
            parseNominal(words)

    };

}

//主語分割
function parseSubjectList(words) {

    const subjects = [];

    let start = 0;

    for (let i = 0; i <= words.length; i++) {

        if (i === words.length || words[i].text === "on") {

            subjects.push(
                parseNounPhrase(
                    words.slice(start, i)
                )
            );

            start = i + 1;
        }

    }

    return subjects;
}

//目的語分割
function parseObjectList(words) {

    const objects = [];

    let start = 0;

    for (let i = 0; i <= words.length; i++) {

        if (i === words.length || words[i].text === "sha") {

            objects.push(
                parseNounPhrase(
                    words.slice(start, i)
                )
            );

            start = i + 1;
        }

    }

    return objects;
}

function parseModifier(words) {

    if (words.length === 0) {
        return null;
    }

    const elyuIndex =
        words.findIndex(
            t => t.text === "elyu"
        );

    if (elyuIndex !== -1) {

        return {

            type:"Or",

            left:
                parseModifier(
                    words.slice(0,elyuIndex)
                ),

            right:
                parseModifier(
                    words.slice(elyuIndex+1)
                )

        };

    }

    // su の数を確認
    const suCount = words.filter(word => word.text === "su").length;

    if (suCount > 1) {
        throw new Error("su は1つの名詞句に2回以上使えません。");
    }

    // su がある場合
    const suIndex = words.findIndex(word => word.text === "su");

    if (suIndex !== -1) {
        return {
            type: "Modify",
            target: parseModifier(words.slice(0, suIndex)),
            modifier: parseModifier(words.slice(suIndex + 1))
        };
    }

    // 左結合
    let tree = words[0];

    for (let i = 1; i < words.length; i++) {

        if (words[i].text === "la") {

            tree = {
                type: "Negate",
                target: tree
            };

        } else {

            tree = {
                type: "Modify",
                target: tree,
                modifier: words[i]
            };

        }
    }

    return tree;
}


// 疑問文かどうか
function processYesNoQuestion(tokens) {

    for (let i = 1; i < tokens.length - 1; i++) {

        if (
            tokens[i] === "la" &&
            tokens[i - 1] === tokens[i + 1]
        ) {

            return {
                isQuestion: true,

                tokens: [
                    ...tokens.slice(0, i),
                    ...tokens.slice(i + 2)
                ]
            };

        }

    }


    return {
        isQuestion: false,
        tokens
    };

}


// shelyoの解析
function parseShelyo(contextWords, mainWords) {


return {

    context:
        parseContext(
            contextWords
        ),


    main:
        parse(
            mainWords
            .map(t => t.text)
            .join(" ")
        )

};

}

// shelyoのコンテクスト解析
function parseContext(words) {


const possibilities = [];


// --------------------
// guあり
// 普通の文として解析
// --------------------

const hasGu =
    words.some(
        w => w.text === "gu"
    );


if (hasGu) {

    possibilities.push({

        role:"Sentence",

        value:
            parse(
                words
                .map(w => w.text)
                .join(" ")
            )

    });


    return possibilities;

}


// --------------------
// shaあり
// 述語 + 目的語
// --------------------

const hasSha =
    words.some(
        w => w.text === "sha"
    );


if (hasSha) {


    possibilities.push({

        role:"PredicateWithObject",

        value:
            parsePredicatePart(
                words
            )

    });


    return possibilities;

}



// --------------------
// guもshaもない
// 名詞句・動詞句両方
// --------------------


possibilities.push({

    role:"Predicate",

    value:
        parsePredicate(
            words
        )

});


return possibilities;

}


// woyaの解析
function processWoya(tokens) {

    return {

        isQuestion:
            tokens.some(
                t => t === "woya"
            )

    };

}


// elyuの解析
function parseElyu(words, parser) {

    const index =
        words.findIndex(
            t => t.text === "elyu"
        );


    // elyuなし
    if (index === -1) {

        return parser(words);

    }


    // 左右に分割
    const left =
        words.slice(0, index);

    const right =
        words.slice(index + 1);



    return {

        type:"Or",

        left:
            parser(left),

        right:
            parseElyu(
                right,
                parser
            )

    };

}

// 文頭gasoの処理
function processGaso(tokens){

    if(tokens[0] === "gaso"){

        return {
            isContrast:true,

            tokens:
                tokens.slice(1)
        };

    }


    return {
        isContrast:false,

        tokens
    };

}

// 数字として扱われる単語か
function isNumberWord(word) {

    return (
        word.text === "la" ||
        numberWords[word.text] !== undefined
    );

}


// 数字の解析
function parseNumber(words, allowZero=false) {

    let value = 0;


    for (const word of words) {


        if (word.text === "la") {

            if (allowZero) {
                value += 0;
            }

            continue;

        }


        value += numberWords[word.text];

    }


    return value;

}

// 数字の並びを探す
function findNumberSequence(words, startIndex=0) {


    let start = -1;
    let end = -1;


    for (let i = startIndex; i < words.length; i++) {


        if (isNumberWord(words[i])) {


            if (start === -1) {
                start = i;
            }


            end = i;


        } else {


            if (start !== -1) {
                break;
            }

        }

    }


    if (start === -1) {
        return null;
    }


    return {

        start,

        end,

        words:
            words.slice(start,end+1)

    };

}


// kekiの解析
function parseOrdinal(words) {


    for (let i = 0; i < words.length - 1; i++) {


        if (words[i].text === "keki") {


            const seq =
                findNumberSequence(
                    words,
                    i + 1
                );


            if (seq) {


                return {

                    index:i,


                    value:
                        parseNumber(
                            seq.words,
                            true
                        ),

                    end:
                        seq.end

                };

            }

        }

    }


    return null;

}


// 句の数字の解析
function parseNominal(words){

    const possibilities = [];


    const ordinal =
        parseOrdinal(words);


    if (ordinal) {

        possibilities.push({

            type:"Ordinal",

            value:
                ordinal.value

        });

        return possibilities;

    }



    const numberSeq =
        findNumberSequence(words);


    if(numberSeq){

        possibilities.push({

            type:"Number",

            value:
                parseNumber(
                    numberSeq.words
                )

        });


    }


    possibilities.push({

        type:"Modifier",

        tree:
            parseModifier(words)

    });


    return possibilities;

}

function processShi(tokens) {

    const index =
        tokens.findIndex(
            t => t === "shi:"
        );


    if(index === -1){

        return {

            hasShi:false,

            tokens

        };

    }


    return {

        hasShi:true,


        main:
            tokens.slice(0,index),


        explanation:
            tokens.slice(index + 1)

    };

}