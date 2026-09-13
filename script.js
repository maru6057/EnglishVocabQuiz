/* ==================================================
   사용 가능한 DAY

   새 DAY를 추가하면
   data/day02.csv를 넣고
   여기만 추가하면 됨.
================================================== */

const availableDays = [
    "day01",
    "day02",
    "day03",
    "day04",
    "day05",
    "day06"
];



/* ==================================================
   상태 변수
================================================== */

let selectedDays = [];

let loadedVocabData = {};


/*
현재 실제로 출제 중인 단어들
*/
let quizWords = [];


/*
현재 사이클을 시작할 때의 전체 단어 목록

결과 화면에서
"같은 단어 전체 다시 시험"
버튼을 눌렀을 때 사용.
*/
let currentCycleBaseWords = [];


let currentIndex = 0;


/*
현재 문제의 정답 의미들
*/
let currentCorrectAnswers = [];


/*
사용자가 현재 문제에서
이미 맞게 선택한 의미들
*/
let selectedCorrectAnswers = [];


/*
오답 기록

key:
day01_dormant

value:
{
    word,
    day,
    choices: [...]
}
*/
let mistakes = {};


/*
SKIP 기록

key:
day01_dormant

value:
{
    word,
    day,
    meanings: [...]
}
*/
let skipped = {};


/*
현재 문제에서 SKIP이 눌렸는지
*/
let currentQuestionSkipped = false;


/*
현재 사이클 종료 후
오답 + 스킵 단어 목록
*/
let currentWrongWords = [];



/* ==================================================
   HTML 요소
================================================== */

const dayScreen =
    document.getElementById("dayScreen");

const quizScreen =
    document.getElementById("quizScreen");

const resultScreen =
    document.getElementById("resultScreen");


const dayButtons =
    document.getElementById("dayButtons");

const startButton =
    document.getElementById("startButton");


const wordElement =
    document.getElementById("word");

const choicesElement =
    document.getElementById("choices");

const progressElement =
    document.getElementById("progress");
const answerCountElement =
    document.getElementById("answerCount");
const skipButton =
    document.getElementById("skipButton");


const perfectWordsElement =
    document.getElementById("perfectWords");

const wrongWordsElement =
    document.getElementById("wrongWords");

const skippedWordsElement =
    document.getElementById("skippedWords");


const retryButton =
    document.getElementById("retryButton");

const wrongOnlyButton =
    document.getElementById("wrongOnlyButton");

const changeDayButton =
    document.getElementById("changeDayButton");



/* ==================================================
   DAY 버튼 생성
================================================== */

function createDayButtons() {

    dayButtons.innerHTML = "";


    availableDays.forEach(day => {

        const button =
            document.createElement("button");


        button.classList.add(
            "dayButton"
        );


        const dayNumber =
            Number(
                day.replace(
                    "day",
                    ""
                )
            );


        button.textContent =
            "DAY " + dayNumber;


        button.addEventListener(
            "click",

            () => {

                button.classList.toggle(
                    "selected"
                );


                if (
                    selectedDays.includes(day)
                ) {

                    selectedDays =
                        selectedDays.filter(
                            item =>
                                item !== day
                        );

                }

                else {

                    selectedDays.push(day);

                }

            }
        );


        dayButtons.appendChild(
            button
        );

    });

}


createDayButtons();



/* ==================================================
   START 버튼
================================================== */

startButton.addEventListener(
    "click",

    async () => {

        if (
            selectedDays.length === 0
        ) {

            alert(
                "DAY를 하나 이상 선택해주세요."
            );

            return;

        }


        startButton.disabled = true;

        startButton.textContent =
            "불러오는 중...";


        try {

            await loadSelectedDays();


            let words = [];


            selectedDays.forEach(day => {

                words.push(
                    ...loadedVocabData[day]
                );

            });


            startNewCycle(words);

        }

        catch (error) {

            console.error(error);


            alert(
                "단어 파일을 불러오지 못했습니다.\n" +
                "CSV 파일 이름과 위치를 확인해주세요."
            );

        }

        finally {

            startButton.disabled = false;

            startButton.textContent =
                "START";

        }

    }
);



/* ==================================================
   선택한 DAY CSV 불러오기
================================================== */

async function loadSelectedDays() {

    loadedVocabData = {};


    for (
        const day of selectedDays
    ) {

        const filePath =
            `data/${day}.csv`;


        const response =
            await fetch(filePath);


        if (!response.ok) {

            throw new Error(
                `${filePath} 파일을 찾을 수 없습니다.`
            );

        }


        const csvText =
            await response.text();


        loadedVocabData[day] =
            parseCSV(
                csvText,
                day
            );

    }

}



/* ==================================================
   CSV → 단어 데이터
================================================== */

function parseCSV(
    csvText,
    day
) {

    const rows =
        parseCSVRows(
            csvText
        );


    if (
        rows.length < 2
    ) {

        return [];

    }


    /*
    UTF-8 BOM 제거
    */
    rows[0][0] =
        rows[0][0].replace(
            /^\uFEFF/,
            ""
        );


    const headers =
        rows[0].map(
            header =>
                header.trim()
        );


    const wordIndex =
        headers.indexOf("Word");

    const meaningIndex =
        headers.indexOf("Meaning");

    const synonymIndex =
        headers.indexOf("Synonyms");

    const exampleIndex =
        headers.indexOf("Example");


    if (
        wordIndex === -1
        ||
        meaningIndex === -1
    ) {

        throw new Error(
            `${day}.csv에 Word 또는 Meaning 열이 없습니다.`
        );

    }


    const vocab = [];


    for (
        let i = 1;
        i < rows.length;
        i++
    ) {

        const row =
            rows[i];


        const word =
            (row[wordIndex] || "")
                .trim();


        const meaningText =
            (row[meaningIndex] || "")
                .trim();


        /*
        빈 행 무시
        */
        if (
            word === ""
            ||
            meaningText === ""
        ) {

            continue;

        }


        /*
        서로 다른 뜻은 ; 기준으로 분리
        */
        const meanings =
            meaningText
                .split(";")
                .map(
                    meaning =>
                        meaning.trim()
                )
                .filter(
                    meaning =>
                        meaning !== ""
                );


        vocab.push({

            day: day,

            word: word,

            meanings: meanings,

            synonyms:
                synonymIndex !== -1
                    ? (row[synonymIndex] || "").trim()
                    : "",

            example:
                exampleIndex !== -1
                    ? (row[exampleIndex] || "").trim()
                    : ""

        });

    }


    return vocab;

}



/* ==================================================
   CSV parser
================================================== */

function parseCSVRows(text) {

    const rows = [];

    let row = [];

    let value = "";

    let insideQuotes = false;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const char =
            text[i];


        if (insideQuotes) {

            if (
                char === '"'
            ) {

                if (
                    text[i + 1] === '"'
                ) {

                    value += '"';

                    i++;

                }

                else {

                    insideQuotes = false;

                }

            }

            else {

                value += char;

            }

        }


        else {

            if (
                char === '"'
            ) {

                insideQuotes = true;

            }


            else if (
                char === ","
            ) {

                row.push(value);

                value = "";

            }


            else if (
                char === "\n"
            ) {

                row.push(value);

                rows.push(row);

                row = [];

                value = "";

            }


            else if (
                char !== "\r"
            ) {

                value += char;

            }

        }

    }


    if (
        value !== ""
        ||
        row.length > 0
    ) {

        row.push(value);

        rows.push(row);

    }


    return rows;

}



/* ==================================================
   새 시험 사이클 시작
================================================== */

function startNewCycle(words) {

    if (
        !words
        ||
        words.length === 0
    ) {

        alert(
            "시험 볼 단어가 없습니다."
        );

        return;

    }


    /*
    현재 사이클 전체 목록 저장
    */
    currentCycleBaseWords =
        [...words];


    /*
    실제 출제 순서는 랜덤
    */
    quizWords =
        [...words];


    shuffleArray(
        quizWords
    );


    currentIndex = 0;

    mistakes = {};

    skipped = {};

    currentWrongWords = [];


    dayScreen.classList.add(
        "hidden"
    );

    resultScreen.classList.add(
        "hidden"
    );

    quizScreen.classList.remove(
        "hidden"
    );


    showQuestion();

}



/* ==================================================
   문제 출력
================================================== */

function showQuestion() {

    const currentWord =
        quizWords[currentIndex];


    wordElement.textContent =
        currentWord.word;


    progressElement.textContent =
        `${currentIndex + 1} / ${quizWords.length}`;


    currentCorrectAnswers =
        [...currentWord.meanings];


    selectedCorrectAnswers =
        [];
    updateAnswerCount();

    currentQuestionSkipped =
        false;


    choicesElement.innerHTML =
        "";


    skipButton.disabled =
        false;


    skipButton.textContent =
        "정답 보기 · SKIP";


    const options =
        createOptions(
            currentWord
        );


    options.forEach(
        optionText => {

            const button =
                document.createElement(
                    "button"
                );


            button.classList.add(
                "choice"
            );


            button.textContent =
                optionText;


            button.addEventListener(
                "click",

                () => {

                    selectChoice(
                        button,
                        optionText
                    );

                }
            );


            choicesElement.appendChild(
                button
            );

        }
    );

}



/* ==================================================
   5지선다 생성
================================================== */

function createOptions(
    currentWord
) {

    /*
    현재 단어의 정답 전체를 먼저 넣음.
    절대로 정답을 잘라내지 않음.
    */
    let options =
        [...currentWord.meanings];


    /*
    정답 개수 + 오답 3개.
    단, 전체 선택지는 최소 5개.
    */

    const targetOptionCount =
        Math.max(
            5,
            currentWord.meanings.length + 3
        );


    let distractorPool =
        [];


    /*
    현재 시험에 포함된 다른 단어들의 뜻을
    오답 후보로 모음.
    */

    quizWords.forEach(
        item => {

            if (
                item !== currentWord
            ) {

                item.meanings.forEach(
                    meaning => {

                        if (
                            !options.includes(
                                meaning
                            )
                            &&
                            !distractorPool.includes(
                                meaning
                            )
                        ) {

                            distractorPool.push(
                                meaning
                            );

                        }

                    }
                );

            }

        }
    );


    shuffleArray(
        distractorPool
    );


    /*
    필요한 만큼 오답 추가
    */

    while (
        options.length < targetOptionCount
        &&
        distractorPool.length > 0
    ) {

        options.push(
            distractorPool.pop()
        );

    }


    /*
    최종 선택지 랜덤 배치
    */

    shuffleArray(
        options
    );


    return options;

}



/* ==================================================
   선택지 클릭
================================================== */

function selectChoice(
    button,
    optionText
) {

    /*
    이미 눌렀던 선택지라면 무시
    */
    if (
        button.classList.contains(
            "correct"
        )
        ||
        button.classList.contains(
            "wrong"
        )
    ) {

        return;

    }


    const currentWord =
        quizWords[currentIndex];


    const key =
        getWordKey(
            currentWord
        );



    /* ==========================
       정답
    ========================== */

    if (
        currentCorrectAnswers.includes(
            optionText
        )
    ) {

        /*
        SKIP 후 파란 힌트 상태였다면
        파란색 제거
        */
        button.classList.remove(
            "hint"
        );


        button.classList.add(
            "correct"
        );


        if (
            !selectedCorrectAnswers.includes(
                optionText
            )
        ) {

            selectedCorrectAnswers.push(
                optionText
            );

            updateAnswerCount();

        }


        /*
        정답을 전부 직접 클릭했으면
        다음 문제로
        */
        if (
            selectedCorrectAnswers.length
            ===
            currentCorrectAnswers.length
        ) {

            skipButton.disabled =
                true;


            setTimeout(
                () => {

                    nextQuestion();

                },

                650
            );

        }

    }



    /* ==========================
       오답
    ========================== */

    else {

        button.classList.add(
            "wrong"
        );


        /*
        이미 SKIP한 문제라면
        오답 기록은 남기지 않음.

        스킵이 최우선 분류이기 때문.
        */
        if (
            currentQuestionSkipped
        ) {

            return;

        }


        if (
            !mistakes[key]
        ) {

            mistakes[key] = {

                word:
                    currentWord.word,

                day:
                    currentWord.day,

                choices: []

            };

        }


        if (
            !mistakes[key]
                .choices
                .includes(
                    optionText
                )
        ) {

            mistakes[key]
                .choices
                .push(
                    optionText
                );

        }

    }

}



/* ==================================================
   SKIP 버튼
================================================== */

skipButton.addEventListener(
    "click",

    () => {

        /*
        이미 SKIP을 눌렀다면 무시
        */
        if (
            currentQuestionSkipped
        ) {

            return;

        }


        const currentWord =
            quizWords[currentIndex];


        const key =
            getWordKey(
                currentWord
            );


        currentQuestionSkipped =
            true;


        /*
        스킵 기록
        */
        skipped[key] = {

            word:
                currentWord.word,

            day:
                currentWord.day,

            meanings:
                [...currentWord.meanings]

        };


        /*
        SKIP이 최우선이므로
        이 문제에서 이전에 누른 오답 기록 삭제
        */
        delete mistakes[key];


        /*
        현재 선택지 버튼 전체 확인
        */
        const buttons =
            choicesElement.querySelectorAll(
                ".choice"
            );


        buttons.forEach(
            button => {

                /*
                아직 사용자가 직접 맞게 누르지 않은
                정답 선택지만 파란색으로 표시
                */
                if (
                    currentCorrectAnswers.includes(
                        button.textContent
                    )
                    &&
                    !button.classList.contains(
                        "correct"
                    )
                ) {

                    button.classList.add(
                        "hint"
                    );

                }

            }
        );


        /*
        SKIP 버튼은 한 문제당 한 번만
        */
        skipButton.disabled =
            true;


        skipButton.textContent =
            "정답이 표시되었습니다";

    }
);



/* ==================================================
   다음 문제
================================================== */

function nextQuestion() {

    currentIndex++;


    if (
        currentIndex
        >=
        quizWords.length
    ) {

        showResults();

        return;

    }


    showQuestion();

}



/* ==================================================
   결과 화면
================================================== */

function showResults() {

    quizScreen.classList.add(
        "hidden"
    );


    resultScreen.classList.remove(
        "hidden"
    );


    perfectWordsElement.innerHTML =
        "";

    wrongWordsElement.innerHTML =
        "";

    skippedWordsElement.innerHTML =
        "";


    currentWrongWords =
        [];


    quizWords.forEach(
        item => {

            const key =
                getWordKey(
                    item
                );


            /*
            ==========================
            1순위: 스킵
            ==========================
            */

            if (
                skipped[key]
            ) {

                addSkippedResult(
                    item
                );


                currentWrongWords.push(
                    item
                );


                return;

            }


            /*
            ==========================
            2순위: 오답
            ==========================
            */

            if (
                mistakes[key]
            ) {

                addWrongResult(
                    item,
                    mistakes[key]
                );


                currentWrongWords.push(
                    item
                );


                return;

            }


            /*
            ==========================
            3순위: 완벽
            ==========================
            */

            addPerfectResult(
                item
            );

        }
    );



    /*
    비어 있는 카테고리 표시
    */

    if (
        perfectWordsElement.children.length === 0
    ) {

        perfectWordsElement.innerHTML =
            `<div class="emptyResult">
                해당 단어가 없습니다.
            </div>`;

    }


    if (
        wrongWordsElement.children.length === 0
    ) {

        wrongWordsElement.innerHTML =
            `<div class="emptyResult">
                해당 단어가 없습니다.
            </div>`;

    }


    if (
        skippedWordsElement.children.length === 0
    ) {

        skippedWordsElement.innerHTML =
            `<div class="emptyResult">
                해당 단어가 없습니다.
            </div>`;

    }


    /*
    틀린/스킵 단어가 하나도 없으면
    오답 재시험 버튼 비활성화
    */
    wrongOnlyButton.disabled =
        currentWrongWords.length === 0;

}



/* ==================================================
   완벽 단어 결과 출력
================================================== */

function addPerfectResult(
    item
) {

    const div =
        document.createElement(
            "div"
        );


    div.classList.add(
        "resultWord"
    );


    div.innerHTML = `

        <strong>
            ${escapeHTML(item.word)}
        </strong>

        <span class="dayLabel">
            ${formatDay(item.day)}
        </span>

    `;


    perfectWordsElement.appendChild(
        div
    );

}



/* ==================================================
   오답 단어 결과 출력
================================================== */

function addWrongResult(
    item,
    mistakeInfo
) {

    const div =
        document.createElement(
            "div"
        );


    div.classList.add(
        "resultWord"
    );


    const wrongChoices =
        mistakeInfo.choices
            .map(
                choice =>
                    escapeHTML(choice)
            )
            .join(", ");


    div.innerHTML = `

        <strong>
            ${escapeHTML(item.word)}
        </strong>

        <span class="dayLabel">
            ${formatDay(item.day)}
        </span>


        <div class="wrongChoiceText">

            잘못 선택:
            ${wrongChoices}

        </div>

    `;


    wrongWordsElement.appendChild(
        div
    );

}



/* ==================================================
   스킵 단어 결과 출력
================================================== */

function addSkippedResult(
    item
) {

    const div =
        document.createElement(
            "div"
        );


    div.classList.add(
        "resultWord"
    );


    const meaningText =
        item.meanings
            .map(
                meaning =>
                    escapeHTML(meaning)
            )
            .join(" / ");


    div.innerHTML = `

        <strong>
            ${escapeHTML(item.word)}
        </strong>

        <span class="dayLabel">
            ${formatDay(item.day)}
        </span>


        <div class="skippedMeaning">

            뜻:
            ${meaningText}

        </div>

    `;


    skippedWordsElement.appendChild(
        div
    );

}



/* ==================================================
   같은 단어 전체 다시 시험
================================================== */

retryButton.addEventListener(
    "click",

    () => {

        startNewCycle(
            currentCycleBaseWords
        );

    }
);



/* ==================================================
   틀린 / 스킵 단어만 다시 시험
================================================== */

wrongOnlyButton.addEventListener(
    "click",

    () => {

        if (
            currentWrongWords.length === 0
        ) {

            return;

        }


        /*
        현재 틀린/스킵 단어 목록을
        다음 사이클의 전체 목록으로 삼음.

        그래서 그 사이클이 끝난 뒤
        "같은 단어 전체 다시 시험"
        을 누르면 바로 이 오답 묶음 전체가 다시 나옴.

        또 다시
        "틀린/스킵 단어만 다시 시험"
        을 누르면 그중에서도 또 틀린 것만 나옴.
        */
        startNewCycle(
            currentWrongWords
        );

    }
);



/* ==================================================
   다른 DAY 선택
================================================== */

changeDayButton.addEventListener(
    "click",

    () => {

        resultScreen.classList.add(
            "hidden"
        );


        quizScreen.classList.add(
            "hidden"
        );


        dayScreen.classList.remove(
            "hidden"
        );

    }
);



/* ==================================================
   단어 고유 키
================================================== */

function getWordKey(
    item
) {

    return (
        item.day
        +
        "_"
        +
        item.word
    );

}



/* ==================================================
   DAY 표시
================================================== */

function formatDay(
    day
) {

    const number =
        Number(
            day.replace(
                "day",
                ""
            )
        );


    return `DAY ${number}`;

}



/* ==================================================
   배열 섞기
================================================== */

function shuffleArray(
    array
) {

    for (
        let i =
            array.length - 1;

        i > 0;

        i--
    ) {

        const j =
            Math.floor(
                Math.random()
                *
                (i + 1)
            );


        [
            array[i],
            array[j]
        ]
        =
        [
            array[j],
            array[i]
        ];

    }

}



/* ==================================================
   HTML 문자열 안전 처리
================================================== */

function escapeHTML(
    text
) {

    return String(text)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}
function updateAnswerCount() {

    answerCountElement.textContent =
        `정답 ${currentCorrectAnswers.length}개 · 선택 ${selectedCorrectAnswers.length} / ${currentCorrectAnswers.length}`;

}