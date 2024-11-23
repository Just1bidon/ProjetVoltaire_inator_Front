document.getElementById('search').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: () => {
            const targetClass = 'css-146c3p1 r-lrvibr';
            const targetStyle = 'color: rgb(22, 27, 39); font-size: 24px; cursor: pointer; font-family: Montserrat-Regular;';
            const elements = document.querySelectorAll(`${targetClass}`);
            console.log(elements);
            
            let count = 0;
            elements.forEach(el => {
              if (el.getAttribute('style') === targetStyle) {
                count++;
              }
            });
            return count;
          }
        },
        (results) => {
          const resultDiv = document.getElementById('result');
          const count = results[0].result;
          if (count > 0) {
            resultDiv.textContent = `✅ ${count} élément(s) trouvé(s) avec la classe et le style spécifiés.`;
          } else {
            resultDiv.textContent = '❌ Aucun élément trouvé avec la classe et le style spécifiés.';
          }
        }
      );
    });
  });
  