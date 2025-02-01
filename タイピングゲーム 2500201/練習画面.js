const originalTextElement = document.getElementById('typeDisplay');

// IDを野田さんのやつに合わせる必要あり
const comparisonTextElement = document.getElementById('romajiDisplay');

const keybordbuffTextElement = document.getElementById('keybordbuff-text-span');
const mistakeSound = document.getElementById('mistake-sound');

let hiraganaRomaji;
let romajiHiragana;
let lyrics;
let currentPosition = {
    line: 0,
    index: 0
};
let buffer = ''; // ひらがな入力を一時的に保持するバッファ

document.addEventListener('DOMContentLoaded', function () {
    const RORIGINAL_KASHI = []; // 歌詞の配列を初期化
    const ROMAJI_KASHI = []; // ローマ字の配列を初期化

    let currentIndex = 0;
    let currentCharIndex = 0;
    let correctChars = 0;    // 正確に入力できた文字数
    let totalChars = 0;
    let isPaused = false;
    let isCountdownStarted = false;
    let startTime;
    let timerInterval;
    let totalMilliseconds = 0;
    let currentChar;
    let currentRomajiLine;

    const typeDisplay = document.getElementById('typeDisplay');
    const romajiDisplay = document.getElementById('romajiDisplay');
    // const typingInput = document.getElementById('typing-input');
    const timerDisplay = document.getElementById('timer-display');
    const accuracyDisplay = document.getElementById('updateAccuracy');
    const popup = document.getElementById('popup');
    const endButton = document.getElementById('end-button');
    const confirmDialog = document.getElementById('confirm-dialog');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    // JSONファイルを読み込む関数
    async function loadJSON() {
        try {
            const romajiHiraganaResponse = await fetch('romaji_hiragana.json');
            romajiHiragana = await romajiHiraganaResponse.json();

            const hiraganaRomajiResponse = await fetch('hiragana_romaji.json');
            hiraganaRomaji = await hiraganaRomajiResponse.json();

            const lyricsResponse = await fetch('lyric_idol.json');
            const lyricsData = await lyricsResponse.json();

            lyricsData.lyrics.forEach(item => {
                RORIGINAL_KASHI.push(item.original);
                ROMAJI_KASHI.push(item.rubi);
            });
        } catch (error) {
            console.error('JSONの読み込みに失敗しました:', error);
        }
    }

    loadJSON().then(() => {
        // データが読み込まれた後に、タイピングゲームの初期化を行う
        // initializeTypingGame();
    });



    // カウントダウンを開始する関数
    function startCountdown() {
        let countdown = 3;
        popup.querySelector('p').textContent = countdown;
        popup.style.display = 'block';
        const countdownInterval = setInterval(() => {
            countdown -= 1;
            if (countdown > 0) {
                popup.querySelector('p').textContent = countdown;
            } else {
                clearInterval(countdownInterval);
                popup.style.display = 'none';
                startTimer();
            }
        }, 1000);
    }

    // タイマーを開始する関数
    function startTimer() {
        // typingInput.disabled = false;
        // typingInput.focus();
        startTime = new Date();
        totalMilliseconds = 0;
        timerInterval = setInterval(updateTimer, 10);
        isPaused = false;
        isCountdownStarted = true;
        showNextLine();
    }

    // タイマーの更新を行う関数
    function updateTimer() {
        totalMilliseconds += 10;
        const minutes = Math.floor(totalMilliseconds / 60000);
        const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
        const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(2, '0')}`;
    }

    // 次の行を表示する関数
    function showNextLine() {
        if (currentIndex < RORIGINAL_KASHI.length) {
            typeDisplay.innerHTML = '';
            romajiDisplay.innerHTML = '';

            const text = RORIGINAL_KASHI[currentIndex];
            const romajiText = ROMAJI_KASHI[currentIndex];

            // テキストをスパンで表示
            text.split('').forEach((char) => {
                const span = document.createElement('span');
                span.textContent = char;
                typeDisplay.appendChild(span);
            });

            romajiText.split('').forEach((char) => {
                const span = document.createElement('span');
                span.textContent = char;
                romajiDisplay.appendChild(span);
            });

            currentCharIndex = 0;
            // typingInput.value = '';
            currentIndex++;
        } else {
            finishTyping();
        }
    }

    // タイピングが終了したときの処理
    function finishTyping() {
        clearInterval(timerInterval);
        // typingInput.disabled = true;

        // 正確に値がカウントされているか確認する
        console.log("正解タイプ数:", correctChars, "合計タイプ数:", totalChars);

        // 結果の計算
        const totalTypedChars = correctChars + totalChars; // 入力した文字数の合計
        const mistypedRate = totalTypedChars > 0 ? ((totalChars / totalTypedChars) * 100).toFixed(2) : 0; // ミスタイプ率（%）
        const elapsedTime = totalMilliseconds / 1000; // 経過時間（秒）
        const typingSpeed = elapsedTime > 0 ? (correctChars / elapsedTime).toFixed(2) : 0; // 1秒あたりのタイプ数

        // タイマーや正確性表示の内容を非表示にして、結果を表示する
        document.getElementById('timer-section').style.display = 'none';
        document.getElementById('result-section').style.display = 'block';
        document.getElementById('ranking-section').style.display = 'block';  // ランキングセクションも表示する

        // 結果を表示
        document.getElementById('correct-chars').textContent = `正解タイプ数: ${correctChars}`;
        document.getElementById('mistyped-rate').textContent = `ミスタイプ率: ${mistypedRate}%`;
        document.getElementById('typing-speed').textContent = `1秒あたりのタイプ数: ${typingSpeed}`;
    }

    // typingInput.addEventListener('input', validateInput);

    /**
     * 入力チェックを行う
     * ただし、入力チェック後ターゲット文字の更新も行う
     */
    function validateInput() {
        // 現在文字の取得
        currentRomajiLine = ROMAJI_KASHI[currentIndex - 1] || '';
        currentChar = currentRomajiLine[currentCharIndex] || '';

        // 入力チェック
        if (convertToHiragana(buffer).includes(currentChar)) {
            // 次のターゲット文字の設定
            correctChars++;
            const spans = romajiDisplay.querySelectorAll('span');
            spans[currentCharIndex].style.color = 'blue';
            currentCharIndex++;
            if (currentCharIndex >= currentRomajiLine.length) {
                showNextLine();
                finishTyping();
            }
        } else if (convertToHiragana(buffer).length > 0) {
            // 間違った入力の場合の表示
            totalChars++;
            const spans = romajiDisplay.querySelectorAll('span');
            if (spans.length) {
                spans[currentCharIndex].style.color = 'red';
                // typingInput.value = '';
            }
        }
        updateAccuracy();
    }

    // 正確性を更新する関数
    function updateAccuracy() {
        const totalTypedChars = correctChars + totalChars; // 入力した文字数の合計
        // const totalCharsToType = ROMAJI_KASHI[currentIndex - 1]?.length || 0; // 現在の行の文字数

        let accuracy = 100; // 初期値を100%にする
        if (totalTypedChars > 0) {
            accuracy = (correctChars / totalTypedChars) * 100;

            // 下記の処理はない状態で正常に動くように計算式を作成するのがただしい
            //accuracy = Math.min(accuracy, 100); // 100%を超えないようにする
        }

        // 小数点以下を切り捨てて整数にする
        accuracy = Math.floor(accuracy);

        // 正確性に応じて色を変更
        if (accuracy >= 80) {
            accuracyDisplay.style.color = '#00A0E9'; // 青色
        } else if (accuracy >= 60) {
            accuracyDisplay.style.color = '#FFD700'; // 黄色
        } else {
            accuracyDisplay.style.color = '#FF4500'; // 赤色
        }

        // 正確性を画面に表示する
        accuracyDisplay.textContent = `${accuracy}%`;
    }
    // キーボードが押されたときの処理
    document.addEventListener('keydown', function (event) {
        // 入力されたキーボードを取得
        const key = event.key;

        // 入力されたキーが1文字且つ、入力チェックの正規表現にマッチする場合
        if (key.length === 1 && key.match(/[a-zA-Z!"#$%&'()¥\-?,.<>\[\]]/i)) {
            // ターゲット文字を取得する
            let targetChar = [];
            targetChar.push(comparisonTextElement.textContent.charAt(currentPosition.index));

            //　促音の場合は次の文字もターゲット文字
            targetChar = targetChar === 'っ' ? [targetChar + comparisonTextElement.textContent.charAt(currentPosition.index + 1)] : targetChar

            //　「ゃ、ゅ、ょ、ぃ」の拗音判定
            if (hiraganaRomaji[targetChar + comparisonTextElement.textContent.charAt(currentPosition.index + 1)]) {
                // ターゲット文字に追加「○ゃ、○ゅ、○ょ、○ぃ」
                targetChar.push(targetChar + comparisonTextElement.textContent.charAt(currentPosition.index + 1))
            }
            if (checkInput(key, targetChar)) {
                // ターゲット文章を全てタイピングした場合、次の文章に更新する
                // next()
                if (comparisonTextElement.textContent.length === currentPosition.index) {
                    currentPosition.index = 0;
                    currentPosition.line++;

                    originalTextElement.textContent = RORIGINAL_KASHI[currentPosition.line];
                    comparisonTextElement.textContent = ROMAJI_KASHI[currentPosition.line];
                }
                updateComparisonText();
            };
        }
        // 入力キーが現在の文字と一致するかどうかを確認
        const isCorrect = key === currentChar;

        // ... 入力判定処理 ...
        highlightKey(key, isCorrect);

    });


    function checkIsCorrect(inputKey) {
        // 入力がundefinedまたは空文字のときはfalseを返す
        if (typeof inputKey === 'undefined' || inputKey === '') {
            console.error("inputKey is undefined or empty");
            return false; // 入力が無効
        }

        // タイピング対象の現在の行のローマ字を取得
        currentRomajiLine = ROMAJI_KASHI[currentIndex - 1] || '';
        console.log("currentRomajiLine:", currentRomajiLine); // デバッグ用

        currentChar = currentRomajiLine[currentCharIndex];

        // currentCharがundefinedの場合の処理
        if (currentChar === undefined) {
            console.error("currentChar is undefined for index:", currentIndex, "and charIndex:", currentCharIndex);
            return false; // 一致しない場合はfalseを返す
        }

        // 入力キーが現在の文字と一致するかどうかを確認
        const isCorrect = inputKey === currentChar.toUpperCase();
        return isCorrect;
    }


    // キーボードのキーが放されたときの処理
    document.addEventListener('keyup', function (event) {
        const key = event.key.toUpperCase();
        console.log(`Key released: ${key}`); // デバッグ用
        unhighlightKey(key);
    });

    // タイマーを一時停止する関数
    function pauseTimer() {
        if (isPaused) return;
        clearInterval(timerInterval);
        isPaused = true;
        // typingInput.disabled = true;
    }

    // タイマーを再開する関数
    function resumeTimer() {
        if (!isPaused) return;
        startTime = new Date() - totalMilliseconds;
        timerInterval = setInterval(updateTimer, 10);
        isPaused = false;
        // typingInput.disabled = false;
        // typingInput.focus();
    }

    // 入力イベントリスナー
    // typingInput.addEventListener('input', validateInput);

    // キーボードイベントリスナー
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            pauseTimer();
        } else if (event.key === 'Enter') {
            resumeTimer();
        } else if (event.key === ' ' && !isCountdownStarted) {
            startCountdown();
        }
    });

    // 終了ボタンのクリックイベントリスナー
    endButton.addEventListener('click', function () {
        confirmDialog.style.display = 'block';
        pauseTimer();
    });

    // 確認ダイアログで「はい」をクリックしたときの処理
    confirmYes.addEventListener('click', function () {
        confirmDialog.style.display = 'none';
        location.reload();
    });

    // 確認ダイアログで「いいえ」をクリックしたときの処理
    confirmNo.addEventListener('click', function () {
        confirmDialog.style.display = 'none';
        resumeTimer();
    });

    function unhighlightKey(key) {
        const keyElement = document.querySelector('#key-' + key.toUpperCase());
        if (keyElement) {
            keyElement.classList.remove('active');
        }
    }


    function highlightKey(key, isCorrect) {
        const keyElement = document.querySelector('#key-' + key.toUpperCase());
        if (keyElement) {
            keyElement.classList.add(isCorrect ? 'correct' : 'incorrect');
            // 一定時間後にハイライトを解除
            setTimeout(() => {
                keyElement.classList.remove('correct', 'incorrect');
            }, 300);
        }
    }

    // キーボードのキーが離されたときの処理
    document.addEventListener('keyup', (event) => {
        const key = event.key;
        unhighlightKey(key);
    });

    // スタートボタンのクリックイベントリスナー
    // document.getElementById('start-button').addEventListener('click', function () {
    //     startCountdown();
    // });

    /**
     *  ローマ字をひらがなに変換する
     *
     * @param {String} input：ローマ字：de, dhi, ttu
     * @return {String} ：該当するひらがな、なければ入力のアルファベットがそのまま戻る
     */
    function convertToHiragana(input) {
        // ローマ字をひらがなに変換する簡易関数

        // 「っ」に相当する促音の検出と変換
        if (input[0] === input[1] && input.length > 2) {
            // let result = (romajiHiragana[input.slice(1)] || input.slice(1))
            let result = romajiHiragana[input.slice(1)]
            if (!result) {
                buffer = ''; // バッファをクリア
                // keybordbuffTextElement.textContent = buffer;
                return result
            }
            result.unshift('っ')
            return result
        }
        return romajiHiragana[input] || [input];
    }

    /**
     * ひらがなをローマ字に変換する
     * 促音「っ」を含む場合は、次の文字と合わせて変換する
     *
     * @param {String} input：ひらがな
     * @return {String} ：該当するローマ字、なければ入力のひらがながそのまま戻る
     */
    function convertToRomaji(input) {
        // ひらがなをローマ字に変換する簡易関数
        // 促音「っ」が含まれる場合の処理
        if (input.length === 2 && input[0] === 'っ') {
            const nextCharRomaji = hiraganaRomaji[input[1]] || input[1]; // 次の文字のローマ字を取得
            // 1文字目（子音部分）を繰り返す（例: "っと" → "tto"）
            return nextCharRomaji.map(str => {
                const firstChar = str.charAt(0); // 最初の文字を取得
                return firstChar + str;          // 最初の文字を2回繰り返す
            });
        }

        // 配列で来たTarget文字をローマ字の配列に変換する
        return input.map(targetChar => hiraganaRomaji[targetChar].toString() || targetChar);
    }



    /**
     * 入力チェックを行う
     *
     * @param {String} key：入力されたキー
     * @param {String} targetChar：ターゲット文字
     */
    function checkInput(key, targetChar) {

        if (isHiragana(targetChar)) {
            // ターゲットがひらがなの場合
            buffer += key.toLowerCase(); // 入力された文字をバッファに追加
            const hiragana = convertToHiragana(buffer);

            // 入力がひらがな且つ、
            if (isHiragana(hiragana) && (hiragana.some(prefix => prefix.startsWith(targetChar)) || hiragana.join('') === targetChar)) {
                // 入力が正しい場合、バッファをクリアして次に進む
                currentPosition.index = currentPosition.index + targetChar.length;
                validateInput();
                buffer = ''; // バッファをクリア
                // keybordbuffTextElement.textContent = buffer;
                return true;
            } else if (!convertToRomaji(targetChar)
                .forEach(target => {
                    if (buffer.startsWith(target)) {
                        buffer = ''; // バッファをクリア
                    }
                })) {

                // } else if (!convertToRomaji(targetChar).some(prefix => prefix.startsWith(hiragana))) {
                //     // 子音の段階で間違っている場合、バッファをクリア
                //     // mistakeSound.play();
                //     buffer = ''; // バッファをクリア
                //     // keybordbuffTextElement.textContent = buffer;
            } else if (buffer.length >= 4) {
                // 4文字以上の入力でまだ正しくない場合もバッファをクリア
                // mistakeSound.play();
                buffer = ''; // バッファをクリア
                // keybordbuffTextElement.textContent = buffer;
            }
            // keybordbuffTextElement.textContent = buffer;
        } else if (key.toLowerCase() === targetChar.toLowerCase()) {
            // ターゲットがローマ字の場合でキー入力と一致している場合
            currentPosition.index++;
            validateInput();
            buffer = ''; // バッファをクリア
            // keybordbuffTextElement.textContent = buffer;
            return true;

        } else if (key.match(/[a-zA-Z!"#$%&'()¥\-?,.<>\[\]]/i)) {
            if (key === toHalfWidth(targetChar) || key === convertToHalfWidth(targetChar)) {
                // 入力が正しい場合、バッファをクリアして次に進む
                currentPosition.index = currentPosition.index + targetChar.length;
                validateInput();
                buffer = ''; // バッファをクリア
                // keybordbuffTextElement.textContent = buffer;
                return true;
            }

        } else {
            // 入力ミス
            // mistakeSound.play();
            buffer = ''; // バッファをクリア
            // keybordbuffTextElement.textContent = buffer;
        }

        validateInput();
    }

});

/**
* ターゲット文章のハイライト処理を次の文字に変更する
*
*/
function updateComparisonText() {
    const textBefore = comparisonTextElement.textContent.slice(0, currentPosition.index);
    const textCurrent = comparisonTextElement.textContent.charAt(currentPosition.index);
    const textAfter = comparisonTextElement.textContent.slice(currentPosition.index + 1);
    //comparisonTextElement.innerHTML = `${textBefore}<span class="highlight">${textCurrent}</span>${textAfter}`;
}

function isHiragana(char) {
    if (Array.isArray(char)) {
        return char.every(c => {
            const code = c.charCodeAt(0);
            return (code >= 0x3040 && code <= 0x309F);
        }); ï
    } else {
        return char.split('').every(c => {
            const code = c.charCodeAt(0);
            return (code >= 0x3040 && code <= 0x309F);
        });
    }
}
