// Read query parameter and update error message
const params = new URLSearchParams(window.location.search);
const query = params.get('query');
const type = params.get('type');

// Function to determine if query is likely an address (all digits)
function isAddress(query) {
  return /^\d+$/.test(query);
}

if (query) {
  let message = '';
  let title = '';
  
  if (type === 'name') {
    title = 'Error: Name not found';
    message = `${query} is NOT currently registered. Please validate availability in mempool if attempting to register. Registry may not be up to block yet.`;
  } else if (type === 'address') {
    title = 'Error: Address not found';
    message = `${query} is NOT currently registered. Please check current blockheight. Registry may not be up to block yet.`;
  } else {
    // fallback for unknown type - determine based on query content
    if (query === 'unknown') {
      title = 'Error: Not found';
      message = `Unable to process the .bitmap request.`;
    } else if (isAddress(query)) {
      title = 'Error: Address not found';
      message = `${query} is NOT currently registered. Please check current blockheight. Registry may not be up to block yet.`;
    } else {
      title = 'Error: Name not found';
      message = `${query} is NOT currently registered. Please validate availability in mempool if attempting to register. Registry may not be up to block yet.`;
    }
  }
  
  document.getElementById('error-title').innerHTML = title;
  document.getElementById('error-message').innerHTML = message;
}
