/* ==================================================
   사용 가능한 DAY

   새로운 DAY를 추가했을 때
   data/day02.csv 파일을 넣고
   아래 배열에 "day02"만 추가하면 됨.
================================================== */

const availableDays = [
    "day01"

    // 나중에:
    // "day02",
    // "day03",
];



/* ==================================================
   변수
================================================== */

let selectedDays = [];

let loadedVocabData = {};

let quizWords = [];

let currentIndex = 0;

let currentCorrectAnswers = [];

let selectedCorrectAnswers = [];

let mistakes = {};



/* ==================================================
   HTML 요소 가져오기
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


const perfectWordsElement =
    document.getElementById("perfectWords");

const wrongWordsElement =
    document.getElementById("wrongWords");


const retryButton =
    document.getElementById("retryButton");

const changeDayButton =
    document.getElementById("changeDayButton");



/* ==================================================
   DAY 선택 버튼 만들기
================================================== */

function createDayButtons() {

    dayButtons.innerHTML = "";


    availableDays.forEach(day => {

        const button =
            document.createElement("button");


        button.classList.add("dayButton");


        const dayNumber =
            day.replace("day", "");


        button.textContent =
            "DAY " + Number(dayNumber);


        button.addEventListener("click", () => {

            button.classList.toggle("selected");


            /* 이미 선택된 DAY라면 선택 해제 */

            if (selectedDays.includes(day)) {

                selectedDays =
                    selectedDays.filter(
                        item => item !== day
                    );

            }

            /* 선택되지 않은 DAY라면 추가 */

            else {

                selectedDays.push(day);

            }

        });


        dayButtons.appendChild(button);

    });

}


createDayButtons();



/* ==================================================
   START 버튼
================================================== */

startButton.addEventListener(
    "click",

    async () => {

        if (selectedDays.length === 0) {

            alert("DAY를 하나 이상 선택해주세요.");

            return;

        }


        startButton.disabled = true;

        startButton.textContent =
            "불러오는 중...";


        try {

            await loadSelectedDays();

            prepareQuiz();

        }

        catch (error) {

            console.error(error);

            alert(
                "단어 파일을 불러오지 못했습니다.\n" +
                "Live Server로 실행 중인지 확인해주세요."
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
   선택된 DAY의 CSV 불러오기
================================================== */

async function loadSelectedDays() {

    loadedVocabData = {};


    for (const day of selectedDays) {

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


        const vocab =
            parseCSV(csvText, day);


        loadedVocabData[day] =
            vocab;

    }

}



/* ==================================================
   CSV → 단어 데이터로 변환

   CSV 형식:

   Word,Meaning,Synonyms,Example

   Meaning 안에서
   ; 를 기준으로 서로 다른 뜻으로 분리함.

   예:
   휴면 상태의, 잠자는; 잠재하는, 잠복 중인

   ↓

   [
      "휴면 상태의, 잠자는",
      "잠재하는, 잠복 중인"
   ]
================================================== */

function parseCSV(csvText, day) {

    const rows =
        parseCSVRows(csvText);


    if (rows.length < 2) {

        return [];

    }


    /* 첫 줄의 BOM 제거 */
    rows[0][0] =
        rows[0][0].replace(/^\uFEFF/, "");


    const headers =
        rows[0].map(
            header => header.trim()
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
            (row[wordIndex] || "").trim();

        const meaningText =
            (row[meaningIndex] || "").trim();


        /* 빈 행 무시 */

        if (
            word === ""
            ||
            meaningText === ""
        ) {

            continue;

        }


        /* ; 기준으로 뜻 나누기 */

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


        const synonyms =
            synonymIndex !== -1
                ? (row[synonymIndex] || "").trim()
                : "";


        const example =
            exampleIndex !== -1
                ? (row[exampleIndex] || "").trim()
                : "";


        vocab.push({

            day: day,

            word: word,

            meanings: meanings,

            synonyms: synonyms,

            example: example

        });

    }


    return vocab;

}



/* ==================================================
   CSV 한 줄 파싱

   쉼표가 들어 있는 셀이나
   "따옴표"가 있는 CSV도 정상적으로 읽기 위함.
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


        /* 따옴표 안 */

        if (insideQuotes) {

            if (char === '"') {

                /* "" 는 실제 따옴표 하나 */

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


        /* 따옴표 밖 */

        else {

            if (char === '"') {

                insideQuotes = true;

            }


            else if (char === ",") {

                row.push(value);

                value = "";

            }


            else if (char === "\n") {

                row.push(value);

                rows.push(row);

                row = [];

                value = "";

            }


            else if (char === "\r") {

                /* Windows 줄바꿈의 \r은 무시 */

            }


            else {

                value += char;

            }

        }

    }


    /* 마지막 줄 */

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
   시험 준비
================================================== */

function prepareQuiz() {

    quizWords = [];


    selectedDays.forEach(day => {

        if (loadedVocabData[day]) {

            quizWords.push(
                ...loadedVocabData[day]
            );

        }

    });


    if (quizWords.length === 0) {

        alert(
            "선택한 DAY에 단어가 없습니다."
        );

        return;

    }


    /* 단어 순서 랜덤 */

    shuffleArray(quizWords);


    currentIndex = 0;

    mistakes = {};


    dayScreen.classList.add("hidden");

    resultScreen.classList.add("hidden");

    quizScreen.classList.remove("hidden");


    showQuestion();

}



/* ==================================================
   문제 보여주기
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


    selectedCorrectAnswers = [];


    const options =
        createOptions(currentWord);


    choicesElement.innerHTML = "";


    options.forEach(optionText => {

        const button =
            document.createElement("button");


        button.classList.add("choice");


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

    });

}



/* ==================================================
   5지선다 생성
================================================== */

function createOptions(currentWord) {

    /*
       현재 단어의 모든 정답을 먼저 넣음.
    */

    let options =
        [...currentWord.meanings];


    /*
       만약 한 단어에 뜻이 5개보다 많으면
       현재 방식의 5지선다로 만들 수 없으므로
       경고 출력
    */

    if (options.length > 5) {

        console.warn(
            `${currentWord.word}의 뜻이 5개보다 많습니다.`
        );


        options =
            options.slice(0, 5);

    }


    let distractorPool = [];


    /*
       선택한 DAY들의 다른 단어 뜻을
       오답 후보로 모음
    */

    quizWords.forEach(item => {

        if (
            item !== currentWord
        ) {

            item.meanings.forEach(
                meaning => {

                    if (
                        !options.includes(meaning)
                        &&
                        !distractorPool.includes(meaning)
                    ) {

                        distractorPool.push(
                            meaning
                        );

                    }

                }
            );

        }

    });


    shuffleArray(
        distractorPool
    );


    /*
       선택지가 총 5개가 될 때까지
       오답 추가
    */

    while (
        options.length < 5
        &&
        distractorPool.length > 0
    ) {

        options.push(
            distractorPool.pop()
        );

    }


    shuffleArray(options);


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
       이미 누른 선택지라면
       다시 작동하지 않음
    */

    if (
        button.classList.contains("correct")
        ||
        button.classList.contains("wrong")
    ) {

        return;

    }


    const currentWord =
        quizWords[currentIndex];


    const word =
        currentWord.word;



    /* -------------------------
       정답 선택
    ------------------------- */

    if (
        currentCorrectAnswers.includes(
            optionText
        )
    ) {

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

        }


        /*
           정답을 전부 골랐다면
           자동으로 다음 문제
        */

        if (
            selectedCorrectAnswers.length
            ===
            currentCorrectAnswers.length
        ) {

            setTimeout(
                () => {

                    nextQuestion();

                },

                650
            );

        }

    }



    /* -------------------------
       오답 선택
    ------------------------- */

    else {

        button.classList.add(
            "wrong"
        );


        /*
           같은 단어가 다른 DAY에도
           존재할 가능성을 대비해
           DAY + 단어를 기록 키로 사용
        */

        const mistakeKey =
            `${currentWord.day}_${word}`;


        if (
            !mistakes[mistakeKey]
        ) {

            mistakes[mistakeKey] = {

                word: word,

                day: currentWord.day,

                choices: []

            };

        }


        if (
            !mistakes[
                mistakeKey
            ].choices.includes(
                optionText
            )
        ) {

            mistakes[
                mistakeKey
            ].choices.push(
                optionText
            );

        }

    }

}



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


    quizWords.forEach(item => {

        const mistakeKey =
            `${item.day}_${item.word}`;


        const div =
            document.createElement("div");


        div.classList.add(
            "resultWord"
        );


        /* -------------------------
           오답 선택 기록 없음
        ------------------------- */

        if (
            !mistakes[mistakeKey]
        ) {

            div.innerHTML = `

                <strong>
                    ${item.word}
                </strong>

                <span style="
                    color:#999;
                    font-size:13px;
                    margin-left:8px;
                ">

                    ${formatDay(item.day)}

                </span>

            `;


            perfectWordsElement.appendChild(
                div
            );

        }


        /* -------------------------
           오답 선택 기록 있음
        ------------------------- */

        else {

            const wrongChoices =
                mistakes[
                    mistakeKey
                ].choices;


            div.innerHTML = `

                <strong>
                    ${item.word}
                </strong>

                <span style="
                    color:#999;
                    font-size:13px;
                    margin-left:8px;
                ">

                    ${formatDay(item.day)}

                </span>


                <div class="wrongChoiceText">

                    잘못 선택:
                    ${wrongChoices.join(", ")}

                </div>

            `;


            wrongWordsElement.appendChild(
                div
            );

        }

    });

}



/* ==================================================
   같은 DAY 다시 시험
================================================== */

retryButton.addEventListener(

    "click",

    () => {

        prepareQuiz();

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

        dayScreen.classList.remove(
            "hidden"
        );

    }

);



/* ==================================================
   DAY 표시 예쁘게
================================================== */

function formatDay(day) {

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
   배열 랜덤 섞기
================================================== */

function shuffleArray(array) {

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