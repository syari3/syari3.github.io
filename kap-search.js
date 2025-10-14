function switchSearchType() {
  const readingRadio = document.getElementById("reading-radio");
  const japaneseRadio = document.getElementById("japanese-radio");
  
  if (readingRadio && readingRadio.checked) {
    document.getElementById("reading").style.display = "grid"; 
    document.getElementById("japanese").style.display = "none"; 
  } else if (japaneseRadio && japaneseRadio.checked) {
    document.getElementById("reading").style.display = "none";
    document.getElementById("japanese").style.display = "grid";
  }
}

function searchKap() {
  const readingRadio = document.getElementById("reading-radio");
  const japaneseRadio = document.getElementById("japanese-radio");
  
  if (readingRadio && readingRadio.checked) {
    searchKapReading();
  } else if (japaneseRadio && japaneseRadio.checked) {
    searchKapJapanese();
  }
}

function displayResults(results) {
  const resultContainer = document.getElementById('result-container');
  resultContainer.innerHTML = '';
  
  const resultMessage = document.createElement('div');
  if (results.length > 0) {
    resultMessage.textContent = `${results.length}個のデータが見つかりました。`;
    resultMessage.style.marginBottom = '15px';
    resultMessage.style.color = '#666';
  } else {
    resultMessage.textContent = '該当するデータは見つかりませんでした。';
  }
  resultContainer.appendChild(resultMessage);

  results.forEach(([key, item]) => {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.dataset.key = key;
    resultItem.dataset.item = JSON.stringify(item);
    
    const wordElement = document.createElement('div');
    wordElement.className = 'result-word';
    wordElement.textContent = key;
    
    const meaningElement = document.createElement('div');
    meaningElement.className = 'result-meaning';
    meaningElement.textContent = item?.meaning || '（意味なし）';
    
    resultItem.appendChild(wordElement);
    resultItem.appendChild(meaningElement);
    
    resultItem.addEventListener('click', () => {
      document.querySelectorAll('.result-item').forEach(el => el.classList.remove('selected'));
      resultItem.classList.add('selected');
      showDetail(key, item);
    });
    
    resultContainer.appendChild(resultItem);
  });
}

function showDetail(key, item) {
  const detailPanel = document.getElementById('detail-panel');
  const detailContent = document.getElementById('detail-content');
  const resultContainer = document.getElementById('result-container');
  
  detailContent.innerHTML = '';
  
  const wordTitle = document.createElement('div');
  wordTitle.className = 'detail-word';
  wordTitle.textContent = key;
  wordTitle.title = 'クリックでコピー';
  wordTitle.addEventListener('click', () => copyToClipboard(key));
  detailContent.appendChild(wordTitle);
  
  const table = document.createElement('table');
  table.className = 'detail-table';
  
  if (item?.reading) {
    const row = document.createElement('tr');
    row.innerHTML = `<td>読み方</td><td>${item.reading}</td>`;
    table.appendChild(row);
  }
  
  if (item?.meaning) {
    const row = document.createElement('tr');
    row.innerHTML = `<td>意味</td><td>${item.meaning}</td>`;
    table.appendChild(row);
  }
  
  if (item?.etymology) {
    const row = document.createElement('tr');
    row.innerHTML = `<td>語源</td><td>${item.etymology}</td>`;
    table.appendChild(row);
  }
  
  if (item?.notes) {
    const row = document.createElement('tr');
    row.innerHTML = `<td>備考</td><td>${item.notes}</td>`;
    table.appendChild(row);
  }
  
  if (item?.examples && item.examples.length > 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.textContent = '例文';
    const examplesCell = document.createElement('td');
    
    item.examples.forEach((example, index) => {
      const exampleItem = document.createElement('div');
      exampleItem.className = 'example-item';
      
      const kapuText = document.createElement('div');
      kapuText.className = 'example-kapu';
      kapuText.textContent = example?.kapu || '';
      kapuText.style.cursor = 'pointer';
      kapuText.title = 'クリックで日本語訳を表示';
      
      const japaneseText = document.createElement('div');
      japaneseText.className = 'example-japanese';
      japaneseText.textContent = example?.japanese || '';
      
      kapuText.addEventListener('click', () => {
        japaneseText.classList.toggle('show');
      });
      
      exampleItem.appendChild(kapuText);
      exampleItem.appendChild(japaneseText);
      examplesCell.appendChild(exampleItem);
    });
    
    row.appendChild(cell);
    row.appendChild(examplesCell);
    table.appendChild(row);
  }
  
  detailContent.appendChild(table);
  
  detailPanel.style.display = 'block';
  
  if (window.innerWidth <= 767) {
    resultContainer.classList.add('hide-mobile');
  }
}

function closeDetail() {
  const detailPanel = document.getElementById('detail-panel');
  const resultContainer = document.getElementById('result-container');
  
  detailPanel.style.display = 'none';
  resultContainer.classList.remove('hide-mobile');
  
  document.querySelectorAll('.result-item').forEach(el => el.classList.remove('selected'));
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showCopyNotification();
  }).catch(err => {
    console.error('コピーに失敗しました:', err);
  });
}

function showCopyNotification() {
  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.textContent = 'コピーしました！';
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 2000);
}

async function searchKapReading() {
  const inputValue = document.getElementById("reading-input").value.trim();
  
  if (!inputValue) {
    dialog("カプ語を入力してください。");
    return;
  }
  
  const filename = 'https://syari-api.onrender.com/kap-data.json';

  try {
    const response = await fetch(filename);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const jsonData = await response.json();
    const results = Object.entries(jsonData).filter(([key, value]) => 
      key && key.toLowerCase().includes(inputValue.toLowerCase())
    );
    results.sort((a, b) => a[0].length - b[0].length);

    if(results.length > 0) {
      dialog(`${results.length}個のデータが見つかりました。`)
    } else {
      dialog("該当するデータは見つかりませんでした。")
    }

    closeDetail();
    displayResults(results);
  } catch (error) {
    console.error("Error fetching or parsing kap-data.json", error);
    dialog("データの取得中にエラーが発生しました。");
  }
}

async function searchKapJapanese() {
  const inputValue = document.getElementById("japanese-input").value.trim();
  
  if (!inputValue) {
    dialog("日本語を入力してください。");
    return;
  }
  
  const filename = 'https://syari-api.onrender.com/kap-data.json';

  try {
    const response = await fetch(filename);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const jsonData = await response.json();
    const results = Object.entries(jsonData).filter(([key, value]) => 
      value?.meaning && value.meaning.includes(inputValue)
    );
    results.sort((a, b) => (a[1]?.meaning?.length || 0) - (b[1]?.meaning?.length || 0));

    if(results.length > 0) {
      dialog(`${results.length}個のデータが見つかりました。`)
    } else {
      dialog("該当するデータは見つかりませんでした。")
    }

    closeDetail();
    displayResults(results);
  } catch (error) {
    console.error("Error fetching or parsing kap-data.json", error);
    dialog("データの取得中にエラーが発生しました。");
  }
}
