document.addEventListener('DOMContentLoaded', function() {
  // Make sure static js is working
  console.log("hi")

  // Test to see emails
  fetch('/emails/inbox')
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      // ... do something else with emails ...
  });

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Compose and send email
  document.getElementById("compose-form").onsubmit = () => {
    const recipients = document.getElementById("compose-recipients").value;
    const subject = document.getElementById("compose-subject").value;
    const body = document.getElementById("compose-body").value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject, 
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      if(!result["error"]){
        load_mailbox('sent');
      }else{
        const element = document.createElement('li');
        element.innerHTML = result["error"];
        document.getElementById("compose-error").append(element);
      }
    })
    return false
  }

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // TODO: 2 have a switch case here
  //    render email by create a clickable div with onclick event handler that triggers put fetch request
}