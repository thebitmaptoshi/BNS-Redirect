# Bitmap-Redirect
Turn your name.bitmap into your URL 

Only works in Chrome, and in Dev Mode.
Go to chrome://extensions/, turn on Dev Mode in upper right corner

save this repository as a file locally 

In chrome extensions tab click on "Load Unpacked" and choose saved repository file

can direct by raw name/address.bitmap or https://same in the URL bar

In alpha, only manually written in names from [BNS/Registry](https://github.com/thebitmaptoshi/BNS/blob/main/Registry/) are currently redirecting appropriately 
Contact me if you want me to plug you in manually, no BNS reinscriptions necessary for testing

I assume no responsibility for any content displayed, I am merely distributing access.

(If you want all inscriptions to go to the inscription page instead of the contents in v1, change line in redirect.js to instead read):

window.location.href = `https://ordinals.com/inscription/${inscriptionId}`;

