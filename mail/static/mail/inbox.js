document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // when an email is sent
  document.querySelector('#compose-form').onsubmit = () => {
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

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
        load_mailbox('sent');
    });
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      add_email(email, mailbox)
    });
  });
}

function add_email(email, mailbox) {
  // create the elements for the email line
  const element = document.createElement('div');
  const date = document.createElement('p');
  const subject = document.createElement('p');
  // get the first recipient
  const name = document.createElement('p');


  if (mailbox === "sent") {
    name.innerHTML = email.recipients[0];
  } else {
    name.innerHTML = email.sender;
  }
  // add the inner html to the elements
  date.innerHTML = email.timestamp;
  subject.innerHTML = email.subject;


  element.classList.add("email", "container","border", "d-flex", "text-size-md", "m-1");

  // if the email has been read or not changes the background of the email
  if (!email.read) {
    element.style.backgroundColor = 'white';
  } else {
    element.style.backgroundColor = '#e0dede';
  }

  name.classList.add("font-weight-bold","mt-2");
  date.classList.add("text-muted","mt-2", "ml-auto")
  subject.classList.add("ml-2","mt-2");

  element.append(name, subject, date);

  // append to the emails view
  document.querySelector('#emails-view').appendChild(element);
  element.addEventListener('click', () => {
    show_email(email.id, mailbox);
  });
}

function show_email(email_id, mailbox) {
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    make_read(email_id);
    document.querySelector('#emails-view').innerHTML = "";
    const info = document.createElement("div");
    info.className = 'card';
    info.innerHTML = `<div class='card-body' style="white-space: pre-wrap;">
      <strong>From:</strong> ${email.sender}
      <strong>To:</strong> ${email.recipients}
      <strong>Subject:</strong> ${email.subject}
      <strong>Date:</strong> ${email.timestamp}
    </div>`;
    document.querySelector('#emails-view').append(info);
    if (mailbox !== 'sent') {
      const buttons = document.createElement('div');

      // reply button
      const reply = document.createElement('button');
      reply.classList.add('btn', 'btn-primary');
      reply.innerHTML = 'Reply';
      reply.addEventListener('click', () => {
        replied(email.sender, email.subject, email.body, email.timestamp);
      })

      // archived button
      const archive = document.createElement('button');
      archive.classList.add('btn', 'btn-danger', 'm-1');
      
      // changed depending on page
      if(mailbox === 'archive'){
        archive.innerHTML = 'Unarchive';
      } else {
        archive.innerHTML = 'Archive';
      }

      archive.addEventListener('click', () => {
        toggle_archive(email_id, email.archived);
        if(email.innerHTML === 'Archive'){
          archive.innerHTML = 'Unarchive';
        } else {
          archive.innerHTML = 'Archive';
        }
      });

      buttons.append(reply, archive);
      document.querySelector('#emails-view').append(buttons);
    }
    const body = document.createElement('div');
    body.innerHTML = email.body;
    document.querySelector('#emails-view').append(body);
  });
}

function replied(sender, subject, body, timestamp) {
  compose_email();

  if (subject.substring(0,4) !== 'Re:') subject = `Re: ${subject}`;
  document.querySelector("#compose-recipients").value = sender;
  document.querySelector("#compose-subject").value = `Re: ${subject}`;

  let filled = `On ${timestamp} ${sender} wrote:\n${body}\n`;
  document.querySelector("#compose-body").value = filled;
  
}

function toggle_archive(email_id, val) {
  fetch(`/emails/${email_id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: !val,
    }),
  })
  .then(() => load_mailbox('inbox'));
}

function make_read(email_id) {
  fetch(`/emails/${email_id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  });
}