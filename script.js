document.addEventListener('DOMContentLoaded', () => {
    const gameItems = document.querySelectorAll('.game-item');
    const gameFrame = document.getElementById('game-frame');

    // ページ読み込み時に最初のゲームをデフォルトで表示
    if (gameItems.length > 0) {
        const firstGameSrc = gameItems[0].dataset.gameSrc;
        if (firstGameSrc) {
            gameFrame.src = firstGameSrc;
            gameItems[0].classList.add('active');
        }
    }

    gameItems.forEach(item => {
        item.addEventListener('click', () => {
            // 他のアイテムのアクティブ状態を解除
            gameItems.forEach(i => i.classList.remove('active'));

            // クリックされたアイテムをアクティブにする
            item.classList.add('active');

            // 対応するゲームをiframeに読み込む
            const gameSrc = item.dataset.gameSrc;
            if (gameSrc) {
                gameFrame.src = gameSrc;
            }
        });
    });
});