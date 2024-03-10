((() =>{
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const colorWheel = document.getElementById('color-wheel');
    const chatMessages = document.getElementById('chat-messages');
    const connectedUsers = document.getElementById('connected-users');
    const chatInput = document.getElementById('chat-input');
    const guessInput = document.getElementById('guess-input');
    const guessButton = document.getElementById('guess-button');
    const messageInput = document.getElementById('message-input');
    const messageButton = document.getElementById('message-button');
  

    // Function to redraw the canvas content
    function redraw() {
      // Save the current canvas content
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Resize the canvas
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Restore the saved canvas content
      context.putImageData(imageData, 0, 0);
    }

    // Set canvas dimensions to match the screen size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Redraw the canvas content whenever the window is resized
    window.addEventListener('resize', redraw);

    // Initialize WebSocket connection

    const address = promptForIP()
    const socket = new WebSocket(address);

  
    // Function to prompt for IP address
    function promptForIP() {
      const ipAddress = prompt('WebSocket connection failed. Please enter the IP address:', 'localhost' );
      return `ws://${ipAddress}:3000`;
    }

    const colors = ['#ff0000', '#ff6600', '#ffcc00', '#00cc00', '#0099ff', '#6600cc', '#cc00cc', '#ff3399'];
    let name = ''
    while(name === '') name = prompt('What is your name?\nYour name can not be emty').trim()

    socket.send(JSON.stringify({type:'name', content:name}))

    // Handle WebSocket connection events
    socket.addEventListener('open', function (event) {
      console.log('WebSocket connection established');
    });
  
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      console.log('Message from server:', event);

      if (message.type === 'chat') {
        displayChatMessage(message.content);
      } else if (message.type === 'guess') {
        displayGuessMessage(message.content);
      } else if (message.type === 'connectedUsers') {
        displayConnectedUsers(message.content);
      } else if (message.type === 'drawing') {
        drawOnCanvas(message.data);
      }else if (message.type === 'color') {
        changeColor(message.data)
      }else if (message.type === 'connectedPlayers') {
        displayConnectedUsers(message.data)
      }
    });
  
    socket.addEventListener('close', function (event) {
      console.log('WebSocket connection closed');
    });
  
    // Handle canvas drawing
    let drawing = false;
    let prevX, prevY
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    function startDrawing(event) {
      drawing = true;
      const rect = canvas.getBoundingClientRect();
      prevX = event.clientX - rect.left;
      prevY = event.clientY - rect.top;
    }

    function draw(event) {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      context.beginPath();
      context.moveTo(prevX, prevY);
      context.lineTo(x, y);
      context.strokeStyle = context.fillStyle;
      context.lineWidth = 3;
      context.stroke();

      // Send drawing data to the server
      socket.send(JSON.stringify({ type: 'drawing', data: { x: x, y: y, prevX: prevX, prevY: prevY } }));

      prevX = x;
      prevY = y;
    }

    function drawOnCanvas(data) {
      context.beginPath();
      context.moveTo(data.prevX, data.prevY);
      context.lineTo(data.x, data.y);
      context.strokeStyle = context.fillStyle;
      context.lineWidth = 3;
      context.stroke();
    }

    function stopDrawing() {
      drawing = false;
    }
    
    // Chat functionality
    function displayChatMessage(message) {
      const messageDiv = document.createElement('div');
      messageDiv.textContent = message;
      messageDiv.classList.add('other')
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  
    // Guess functionality
    guessButton.addEventListener('click', sendGuess);
    guessInput.addEventListener('keypress', function (event) {
      if (event.key === 'Enter') {
        sendGuess();
      }
    });
  
    function sendGuess() {
      const guess = guessInput.value.trim();
      if (guess !== '') {
        socket.send(JSON.stringify({ type: 'guess', content: '['+name+' Guessed]: '+guess }));
        guessInput.value = '';
      }
    }
  
    function displayGuessMessage(guess) {
      const guessDiv = document.createElement('div');
      guessDiv.textContent = guess;
      chatMessages.appendChild(guessDiv);
    }
  
    // Message functionality
    messageButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function (event) {
      if (event.key === 'Enter') {
        sendMessage();
      }
    });
  
    function sendMessage() {
      const message = messageInput.value.trim();
      if (message !== '') {
        socket.send(JSON.stringify({ type: 'chat', content: name + ': ' + message }));

        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.classList.add('me')
        chatMessages.appendChild(messageDiv);
        messageInput.value = '';
      }
    }
  
    // Connected users functionality
    function displayConnectedUsers(users) {
      connectedUsers.innerHTML = '<h4>Connected Users</h4>';
      users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.textContent = user;
        connectedUsers.appendChild(userDiv);
      });
    }

    // Color wheel functionality
    colors.forEach(color => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'color';
        colorDiv.style.backgroundColor = color;
        colorDiv.addEventListener('click', function () {
        changeColor(color);
        });
        colorWheel.appendChild(colorDiv);
    });

    function changeColor(color) {
        context.strokeStyle = color;
        context.fillStyle = color;
        socket.send(JSON.stringify({type:'color', data: color}))
    }
  })())
  