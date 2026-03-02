/**
 * GitHub API を使って JSON ファイルを kpi-dashboard リポジトリに push する共通関数
 *
 * 事前設定:
 *   GAS > プロジェクトの設定 > スクリプトプロパティ に以下を追加
 *     GITHUB_TOKEN : Fine-grained PAT (Contents: Read and Write)
 *
 * 使い方:
 *   pushJsonToGitHub("kpi.json", jsonString);
 */

var GITHUB_OWNER = "kentoo77";
var GITHUB_REPO  = "kpi-dashboard";
var GITHUB_BRANCH = "main";

/**
 * JSON文字列を GitHub リポジトリの data/ ディレクトリに push する
 * @param {string} filename - ファイル名 (例: "kpi.json")
 * @param {string} jsonString - JSON文字列
 */
function pushJsonToGitHub(filename, jsonString) {
  var token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
  if (!token) {
    Logger.log("GITHUB_TOKEN が設定されていません。スクリプトプロパティを確認してください。");
    return;
  }

  var path = "data/" + filename;
  var apiUrl = "https://api.github.com/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/contents/" + path;

  var headers = {
    "Authorization": "Bearer " + token,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  // 1. 既存ファイルの sha を取得（ファイルが存在しない場合は null）
  var sha = null;
  try {
    var getRes = UrlFetchApp.fetch(apiUrl + "?ref=" + GITHUB_BRANCH, {
      method: "get",
      headers: headers,
      muteHttpExceptions: true
    });
    if (getRes.getResponseCode() === 200) {
      var existing = JSON.parse(getRes.getContentText());
      sha = existing.sha;
    }
  } catch (e) {
    Logger.log("SHA取得エラー: " + e.message);
  }

  // 2. Base64 エンコードして PUT
  var content = Utilities.base64Encode(jsonString, Utilities.Charset.UTF_8);

  var payload = {
    message: "data: update " + filename + " [auto]",
    content: content,
    branch: GITHUB_BRANCH
  };

  if (sha) {
    payload.sha = sha;
  }

  var putRes = UrlFetchApp.fetch(apiUrl, {
    method: "put",
    headers: headers,
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = putRes.getResponseCode();
  if (code === 200 || code === 201) {
    Logger.log("GitHub push 成功: " + path);
  } else {
    Logger.log("GitHub push 失敗 (" + code + "): " + putRes.getContentText());
  }
}

/**
 * テスト用: サンプルJSONをpushして動作確認
 */
function testPushJsonToGitHub() {
  var testJson = JSON.stringify({ test: true, timestamp: new Date().toISOString() }, null, 2);
  pushJsonToGitHub("_test.json", testJson);
}
