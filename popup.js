document.getElementById("startBtn").addEventListener("click", async () => {
  try {
    await chrome.tabs.create({ url: chrome.runtime.getURL("game.html") });
    window.close();
  } catch (e) {
    console.error(e);
    alert("ゲーム画面を開けませんでした。");
  }
});
