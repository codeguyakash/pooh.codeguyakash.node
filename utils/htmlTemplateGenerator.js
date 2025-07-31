htmlTemplateGenerator = (title, message, isSuccess) => {
  return `
   <html>
        <head>
            <title>${title}</title>
            <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
            body {
                font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                text-align: center;
                font-size: 20px;
                margin-top: 50px;
                font-weight: 200;
                display: flex;
                justify-content: center;
                align-items: start;
            }
            img {
                width: 50px;
                height: 50px;
                margin-top: 10px;
            }
            div {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            </style>
        </head>
        <body>
            <div>
            ${message}
            <img
                src="https://img.icons8.com/color/48/${isSuccess ? 'verified-badge.png' : 'close-window.png'}"
                alt="${isSuccess ? 'verified-badge' : 'close-window'}" />
            </div>
        </body>
    </html>
  `;
};

module.exports = {
  htmlTemplateGenerator,
};
