async function fetchAPI(apiUrl, headers) {
  try {
    const response = await fetch(apiUrl, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
}

function createButton(label, onClick) {
  const newButton = document.createElement('a');
  newButton.href = "#";
  newButton.className = "Button--secondary Button--small Button";
  newButton.setAttribute('data-view-component', 'true');
  newButton.setAttribute('data-custom-button', 'true');
  newButton.addEventListener('click', function(event) {
    event.preventDefault();
    onClick();
  });

  const buttonContent = document.createElement('span');
  buttonContent.className = "Button-content";
  const buttonLabel = document.createElement('span');
  buttonLabel.className = "Button-label";
  buttonLabel.textContent = label;

  buttonContent.appendChild(buttonLabel);
  newButton.appendChild(buttonContent);

  return newButton;
}

async function handleGistUrl(gistUrl) {
  const gistRegex = /https:\/\/gist\.github\.com\/([^\/]+)\/([a-f0-9]+)$/;
  const match = gistRegex.exec(gistUrl);

  if (!match) {
    console.log('Invalid Gist URL');
    return;
  }

  const [_, username, gistId] = match;
  const apiUrl = `https://api.github.com/gists/${gistId}`;
  const headers = {
    'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  };

  const data = await fetchAPI(apiUrl, headers);
  if (data) {
    const sha = data.history[0].version;
    const files = Object.keys(data.files);
    if (files.length > 0) {
      const filePath = files[0];
      const githackUrl = `https://gistcdn.githack.com/${username}/${gistId}/raw/${sha}/${filePath}`;
      window.open(githackUrl, '_blank');
    } else {
      console.error('No files found in the Gist');
    }
  }
}

async function handleGitHubUrl(githubUrl) {
  const githubRegex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/;
  const match = githubRegex.exec(githubUrl);

  if (!match) {
    console.log('Invalid GitHub URL');
    return;
  }

  const [_, username, repoName, branchName, filePath] = match;
  const apiUrl = `https://api.github.com/repos/${username}/${repoName}/git/refs/heads/${branchName}`;
  const headers = {
    'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  };

  const data = await fetchAPI(apiUrl, headers);
  if (data) {
    const sha = data.object.sha;
    const githackUrl = `https://rawcdn.githack.com/${username}/${repoName}/${sha}/${filePath}`;
    window.open(githackUrl, '_blank');
  }
}

function addButtonToGist() {
  const fileActionsDiv = document.querySelector('div.file-actions');
  if (!fileActionsDiv) return false;

  const existingButton = fileActionsDiv.querySelector('a[data-custom-button="true"]');
  if (existingButton) return true;

  const originalButton = fileActionsDiv.querySelector('a.Button--secondary.Button--small.Button');
  if (!originalButton) return false;

  const newButton = createButton('Cdn', () => {
    const gistUrl = window.location.href;
    handleGistUrl(gistUrl);
  });

  originalButton.style.borderTopRightRadius = '0';
  originalButton.style.borderBottomRightRadius = '0';
  newButton.style.borderTopLeftRadius = '0';
  newButton.style.borderBottomLeftRadius = '0';

  fileActionsDiv.insertBefore(newButton, originalButton.nextSibling);
  console.log('Gist Button Complete!');
  return true;
}

function addButtonToGithub() {
  const originalButton = document.querySelector('.types__StyledButton-sc-ws60qy-0.hmzEcU');
  const rawButton = document.querySelector('a[data-testid="raw-button"]');
  if (!originalButton || !rawButton) return false;

  const existingButton = originalButton.parentNode.querySelector('a[data-custom-button="true"]');
  if (existingButton) return true;

  const newButton = createButton('Cdn', () => {
    const githubUrl = window.location.href;
    handleGitHubUrl(githubUrl);
  });

  originalButton.parentNode.insertBefore(newButton, originalButton);
  console.log('GitHub Button Complete!');
  return true;
}

function attemptToAddButton() {
  const url = window.location.href;
  if (url.startsWith('https://gist.github.com/')) {
    return addButtonToGist();
  } else if (url.startsWith('https://github.com/')) {
    return addButtonToGithub();
  }
  return false;
}

function observeDOMChanges() {
  const observer = new MutationObserver(() => {
    attemptToAddButton();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function handleLocationChange() {
  attemptToAddButton();
}

const pushState = history.pushState;
history.pushState = function() {
  pushState.apply(history, arguments);
  handleLocationChange();
};

const replaceState = history.replaceState;
history.replaceState = function() {
  replaceState.apply(history, arguments);
  handleLocationChange();
};

window.addEventListener('popstate', handleLocationChange);
observeDOMChanges();
handleLocationChange();
