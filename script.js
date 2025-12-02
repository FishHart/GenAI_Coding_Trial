/* --- データ定義 --- */

// 1. ショップの食材（購入には謎解きが必要）
const shopItems = [
    {
        id: "egg",
        name: "新鮮な卵",
        icon: "🥚",
        riddle: "殻を破って生まれる、黄色い顔のあの子は？",
        answer: "ひよこ",
        isSold: false
    },
    {
        id: "meat",
        name: "特選和牛",
        icon: "🥩",
        riddle: "『焼肉』を反対から読むと？（ひらがな3文字）",
        answer: "くにき",
        isSold: false
    },
    {
        id: "rice",
        name: "最高級米",
        icon: "🍚",
        riddle: "八十八の手間がかかると言われる穀物は？",
        answer: "米",
        isSold: false
    },
    {
        id: "shrimp",
        name: "オマール海老",
        icon: "🦞",
        riddle: "ABCDE... アルファベットの中に隠れている海の生き物は？",
        answer: "エビ", // AB
        isSold: false
    },
    {
        id: "onion",
        name: "玉ねぎ",
        icon: "🧅",
        riddle: "切ると涙が出る野菜は？",
        answer: "玉ねぎ",
        isSold: false
    }
];

// 2. レシピ（一部の材料が黒塗り）
const recipes = [
    {
        id: "r_beefbowl",
        name: "牛丼",
        stars: 3,
        // materials: 表示名, neededId: shopItemsのID, isRedacted: 黒塗りか, riddle: 解除謎
        ingredients: [
            { name: "最高級米", neededId: "rice", isRedacted: false },
            { name: "特選和牛", neededId: "meat", isRedacted: true, riddle: "モーモー鳴く動物のお肉", answer: "牛肉" },
            { name: "玉ねぎ", neededId: "onion", isRedacted: true, riddle: "剥いても剥いても皮ばかりの野菜", answer: "玉ねぎ" }
        ],
        resultIcon: "🐮"
    },
    {
        id: "r_omelet",
        name: "プレーンオムレツ",
        stars: 2,
        ingredients: [
            { name: "新鮮な卵", neededId: "egg", isRedacted: true, riddle: "オムライスの黄色い部分", answer: "卵" }
        ],
        resultIcon: "🍳"
    },
    {
        id: "r_paella",
        name: "豪華パエリア",
        stars: 5,
        ingredients: [
            { name: "最高級米", neededId: "rice", isRedacted: false },
            { name: "オマール海老", neededId: "shrimp", isRedacted: true, riddle: "腰の曲がった長寿の象徴", answer: "エビ" }
        ],
        resultIcon: "🥘"
    }
];

// 状態管理
let inventory = []; // 所持している shopItems の id
let currentPuzzleType = null; // 'shop' or 'recipe'
let currentTargetObj = null; // 謎解き中の対象オブジェクト

window.onload = function() {
    renderShop();
    renderRecipes();
};

/* --- タブ切り替え --- */
function switchTab(tabName) {
    // ボタンのアクティブ化
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // コンテンツの切り替え
    document.querySelectorAll('.tab-content').forEach(div => div.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');

    if (tabName === 'cooker') {
        renderCooker();
    }
}

/* --- ショップ機能 --- */
function renderShop() {
    const list = document.getElementById('shop-list');
    list.innerHTML = "";
    shopItems.forEach(item => {
        const div = document.createElement('div');
        div.className = `shop-item ${item.isSold ? 'sold-out' : ''}`;
        div.onclick = () => { if(!item.isSold) openPuzzle('shop', item); };
        div.innerHTML = `
            <span style="font-size:1.5rem">${item.icon}</span>
            <div style="flex:1; margin-left:10px">
                <b>${item.name}</b>
            </div>
            <button class="primary-btn" style="font-size:0.8rem">入荷</button>
        `;
        list.appendChild(div);
    });
}

/* --- レシピ機能 --- */
function renderRecipes() {
    const list = document.getElementById('recipe-list');
    list.innerHTML = "";

    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        
        let ingHTML = "";
        recipe.ingredients.forEach((ing, index) => {
            if (ing.isRedacted) {
                // 黒塗り状態
                ingHTML += `・<span class="redacted-text" onclick="openPuzzle('recipe', {r: '${recipe.id}', i: ${index}})">████</span><br>`;
            } else {
                // 解除済み
                ingHTML += `・${ing.name}<br>`;
            }
        });

        card.innerHTML = `
            <div class="recipe-header">
                <span class="recipe-name">${recipe.name}</span>
                <span style="color:orange">★${recipe.stars}</span>
            </div>
            <div class="ingredient-list">
                ${ingHTML}
            </div>
        `;
        list.appendChild(card);
    });
}

/* --- 謎解きシステム共通 --- */
function openPuzzle(type, target) {
    currentPuzzleType = type;
    currentTargetObj = target; // shopならitem, recipeなら{r:id, i:index}

    const modalTitle = document.getElementById('puzzle-title');
    const modalDesc = document.getElementById('puzzle-desc');
    const modalText = document.getElementById('puzzle-text');
    const input = document.getElementById('answer-input');

    input.value = "";
    document.getElementById('feedback-msg').innerText = "";

    if (type === 'shop') {
        modalTitle.innerText = "入荷の謎";
        modalDesc.innerText = "この食材を入手するために謎を解いてください。";
        modalText.innerText = `Q. ${target.riddle}`;
    } else if (type === 'recipe') {
        const recipe = recipes.find(r => r.id === target.r);
        const ing = recipe.ingredients[target.i];
        modalTitle.innerText = "レシピ修復";
        modalDesc.innerText = "汚れて読めない箇所があります。推測してください。";
        modalText.innerText = `Q. ${ing.riddle}`;
    }

    // スマホを一時的に隠す
    document.getElementById('smartphone-modal').style.display = 'none';
    document.getElementById('puzzle-modal').style.display = 'flex';
}

function submitAnswer() {
    const input = document.getElementById('answer-input').value.trim();
    let isCorrect = false;
    let correctAnswer = "";

    if (currentPuzzleType === 'shop') {
        correctAnswer = currentTargetObj.answer;
        if (input === correctAnswer) isCorrect = true;
    } else if (currentPuzzleType === 'recipe') {
        const recipe = recipes.find(r => r.id === currentTargetObj.r);
        const ing = recipe.ingredients[currentTargetObj.i];
        correctAnswer = ing.answer;
        if (input === correctAnswer) isCorrect = true;
    }

    if (isCorrect) {
        document.getElementById('puzzle-modal').style.display = 'none';
        document.getElementById('smartphone-modal').style.display = 'flex';
        
        if (currentPuzzleType === 'shop') {
            // ショップ購入処理
            currentTargetObj.isSold = true;
            inventory.push(currentTargetObj.id);
            alert(`${currentTargetObj.name} を入手しました！`);
            renderShop();
        } else {
            // レシピ解除処理
            const recipe = recipes.find(r => r.id === currentTargetObj.r);
            recipe.ingredients[currentTargetObj.i].isRedacted = false;
            alert("レシピの材料が判明しました！");
            renderRecipes();
        }
    } else {
        const feedback = document.getElementById('feedback-msg');
        feedback.innerText = "答えが違います...";
        feedback.style.color = "red";
    }
}

/* --- なんでも調理器 --- */
function renderCooker() {
    const select = document.getElementById('cooker-recipe-select');
    const invList = document.getElementById('cooker-inventory-list');
    
    // 1. レシピ選択肢の更新（すべての黒塗りが解除されたもののみ）
    select.innerHTML = '<option value="">-- 選択してください --</option>';
    recipes.forEach(r => {
        const isFullyRevealed = r.ingredients.every(i => !i.isRedacted);
        if (isFullyRevealed) {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.innerText = r.name;
            select.appendChild(opt);
        }
    });

    // 2. 所持食材リストの更新
    invList.innerHTML = "";
    if (inventory.length === 0) {
        invList.innerHTML = '<div class="empty-msg">食材を持っていません</div>';
    } else {
        inventory.forEach(itemId => {
            const item = shopItems.find(i => i.id === itemId);
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="checkbox" name="cook-ing" value="${item.id}">
                <span>${item.icon} ${item.name}</span>
            `;
            invList.appendChild(div);
        });
    }
}

function executeCooking() {
    const select = document.getElementById('cooker-recipe-select');
    const recipeId = select.value;
    
    if (!recipeId) {
        alert("レシピを選択してください。（黒塗りを全て解除する必要があります）");
        return;
    }

    // 選択された食材を取得
    const checkedBoxes = document.querySelectorAll('input[name="cook-ing"]:checked');
    const selectedIngIds = Array.from(checkedBoxes).map(cb => cb.value);

    // 正誤判定
    const targetRecipe = recipes.find(r => r.id === recipeId);
    const neededIds = targetRecipe.ingredients.map(i => i.neededId);

    // 1. 数が合っているか
    if (selectedIngIds.length !== neededIds.length) {
        alert("食材の数が合いません。");
        return;
    }

    // 2. 内容が合っているか（順番関係なく比較）
    const isMatch = neededIds.every(id => selectedIngIds.includes(id));

    if (isMatch) {
        // 成功！
        closeModal('smartphone-modal');
        spawnDish(targetRecipe);
    } else {
        alert("選んだ食材が間違っています。レシピをよく確認してください。");
    }
}

function spawnDish(recipe) {
    // 画面に料理を出現させる
    const el = document.createElement('div');
    el.className = 'draggable-item';
    el.innerText = recipe.resultIcon;
    el.style.left = '50%';
    el.style.top = '30%';
    document.getElementById('kitchen-container').appendChild(el);
    makeDraggable(el);

    // スコア加算
    let currentScore = parseInt(document.getElementById('total-stars').innerText);
    currentScore += recipe.stars;
    document.getElementById('total-stars').innerText = currentScore;

    alert(`調理成功！\n${recipe.name} が完成しました！（★+${recipe.stars}）`);
}

// モーダル制御
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ドラッグ機能（前回と同じ）
function makeDraggable(elmnt) {
    let pos1=0, pos2=0, pos3=0, pos4=0;
    elmnt.onmousedown = dragMouseDown;
    function dragMouseDown(e) {
        e.preventDefault(); pos3=e.clientX; pos4=e.clientY;
        document.onmouseup = closeDragElement; document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
        e.preventDefault(); pos1=pos3-e.clientX; pos2=pos4-e.clientY;
        pos3=e.clientX; pos4=e.clientY;
        elmnt.style.top=(elmnt.offsetTop-pos2)+"px"; elmnt.style.left=(elmnt.offsetLeft-pos1)+"px";
    }
    function closeDragElement() { document.onmouseup=null; document.onmousemove=null; }
}
