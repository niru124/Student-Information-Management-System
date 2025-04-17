// chat.css.js (this is a merged JS and CSS file for simplicity)

// Adding the styles dynamically (CSS)
const style = document.createElement('style');
style.innerHTML = `
    #chat-room {
        font-family: Arial, sans-serif;
        margin: 20px;
    }
    #messages {
        background-color: #f0f0f0;
        padding: 10px;
        height: 300px;
        overflow-y: scroll;
    }
    #message-input {
        width: 100%;
        padding: 10px;
        margin-top: 10px;
    }
    button {
        padding: 10px;
        background-color: #007BFF;
        color: white;
        border: none;
        cursor: pointer;
    }
    button:hover {
        background-color: #0056b3;
    }
`;
document.head.appendChild(style);

// chat.js functionality (the JavaScript)
const socket = io();
const userId = '<%= teacher._id || student._id %>';
const recipientId = '<%= teacher._id !== student._id ? teacher._id : student._id %>';

socket.emit('<%= teacher._id ? "teacherConnect" : "studentConnect" %>', userId);

socket.on('message', (data) => {
    const messageDiv = document.getElementById('messages');
    messageDiv.innerHTML += `<p><strong>${data.from}</strong>: ${data.message}</p>`;
});

function sendMessage() {
    const message = document.getElementById('message-input').value;
    socket.emit('sendMessage', { from: userId, to: recipientId, message });
}

