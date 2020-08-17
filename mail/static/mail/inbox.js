document.addEventListener('DOMContentLoaded', function() {

  window.onpopstate = (event) =>{
    if (event.state !== null){
      let page = event.state.page;
      console.log(page);
      if (page === 'compose'){
        compose_email();
      }
      else if (page === 'message'){
        let message_id = event.state.message_id;
        console.log(message_id);
        getMessage(message_id);
      }
      else{
        load_mailbox(page);
      }
    }
  }

  // Use buttons to toggle between views

  let inbox = document.querySelector('#inbox');
  inbox.addEventListener('click', () => {
    history.pushState({page:'inbox'},'', 'inbox');
    load_mailbox('inbox');
  });
  let sent = document.querySelector('#sent');
  sent.addEventListener('click', () => {
      history.pushState({page:'sent'}, '', 'sent');
      load_mailbox('sent');
  });
  let archived = document.querySelector('#archived');
  archived.addEventListener('click', () => {
    history.pushState({page:'sent'},'', 'archived');
    load_mailbox('archive');
  });
  let compose = document.querySelector('#compose');
  compose.addEventListener('click', () => {
    history.pushState({page:'compose'}, '', 'compose');
    compose_email(); 
  });
  // By default, load the inbox
  history.pushState({page:'inbox'},'', 'inbox');
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

  let form = document.querySelector('#compose-form');
  form.addEventListener('submit', processForm);
}

function processForm(event){
  event.preventDefault();
  let to = document.getElementById('compose-recipients').value;
  let subject = document.getElementById('compose-subject').value;
  let body = document.getElementById('compose-body').value;

  let form_obj = {
    recipients: to,
    subject: subject,
    body: body
  };

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify(form_obj)
  })
  .then(response => response.json())
  .then(result => {
    console.log(result)
  });
  load_mailbox('inbox');
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  let emails_view = document.querySelector('#emails-view');
  emails_view.style.display = 'block';
  let compose_view = document.querySelector('#compose-view');
  compose_view.style.display = 'none';

  // Show the mailbox name
  emails_view.innerHTML = `<h3 class='inbox-title'>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  // fetch emails and present them
  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(data =>{
    const ul_elem = document.createElement('ul');
    ul_elem.className = 'inbox-container';
    for (let k = 0;k < data.length; k++){
      li_elem = document.createElement('li');
      li_elem.innerHTML = `<span class = "inbox-sender"> ${data[k]['sender']}</span>
      <span class="inbox-subject"> ${data[k]['subject'].slice(0,45)}</span>
      <span class="inbox-date"> ${data[k]['timestamp']}</span>`;
      if (data[k]['read']){
        li_elem.className = 'inbox-message message-read';
      }
      else{
        li_elem.className = 'inbox-message message-unread';
      }
      li_elem.id = `${data[k]['id']}`;
      li_elem.addEventListener('click', () => {
        let message_id = data[k]['id'];
        history.pushState({page:'message', message_id:message_id},
                          '',`message${message_id}`);
        getMessage(message_id);
      });
      ul_elem.append(li_elem)
    };
    emails_view.append(ul_elem);
  })
}

function getMessage(id){
  // console.log(`Message with id = ${id} was clicked`);
  fetch(`emails/${id}`)
  .then(response => response.json())
  .then(email => {
      let div_header = document.createElement('ul');
      div_header.className = 'email-header';
      // console.log(email);
      let par_from = document.createElement('li');
      par_from.innerHTML = `<span class="header-line">From: </span> ${email['sender']}`;
      div_header.append(par_from);
      let par_to = document.createElement('li');
      par_to.innerHTML = `<span class="header-line">To: </span> ${email['recipients']}`;
      div_header.append(par_to);
      let par_subject = document.createElement('li');
      par_subject.innerHTML = `<span class="header-line">Subject: </span>${email['subject']}`;
      div_header.append(par_subject);
      let par_date = document.createElement('li');
      par_date.innerHTML = `<span class="header-line"> Timestamp:</span> ${email['timestamp']}`;
      div_header.append(par_date);

      // create header button elements
      let button_list = document.createElement('div');
      button_list.className = 'header-buttons';

      let reply = document.createElement('button');
      reply.className = 'btn btn-sm btn-secondary mt-3 mr-2';
      reply.innerHTML = 'Reply';
      reply.addEventListener('click', () => {
        reply_email(email);
      });
      button_list.append(reply);

      let archive = document.createElement('button');
      archive.className = 'btn btn-sm btn-secondary mt-3 mr-2';
      if (email['archived']){
        archive.innerHTML = 'Unarchive';
        archive.addEventListener('click', () => {
          processArchive(id, false);
        });
      }
      else {
        archive.innerHTML = 'Archive';
        archive.addEventListener('click', () => {
          processArchive(id, true);
        });
      }
      button_list.append(archive);

      // set the mail as read
      fetch(`/emails/${id}`, {
        method:'PUT',
        body: JSON.stringify({read:true})
      })
      .then(response =>{
        console.log(response.status)
      });

      let unread = document.createElement('button');
      unread.className = 'btn btn-sm btn-secondary mt-3 mr-2';
      unread.innerHTML = 'Mark as unread';
      unread.addEventListener('click', () => {
        processUnread(id);
      });
      button_list.append(unread);
      

      div_header.append(button_list);

      let div_body = document.createElement('div');
      div_body.className = 'email-body';
      let par_body = document.createElement('p');
      par_body.innerHTML = email['body'];
      div_body.append(par_body);

      let emailsView = document.querySelector('#emails-view');
      emailsView.innerHTML='';
      emailsView.append(div_header);
      emailsView.append(div_body);
      // console.log(`email-${id}= ${email['read']}`);
  });
}

function processArchive(id, truthy){
  let archive = truthy ? true : false;
  fetch(`/emails/${id}`, {
    method:'PUT',
    body: JSON.stringify({archived:archive})
  })
  .then(response =>{
    console.log(response.status)
  });
  load_mailbox('inbox');
}

function processUnread(id){
  fetch(`/emails/${id}`, {
    method:'PUT',
    body: JSON.stringify({read:false})
  })
  .then(response =>{
    console.log(response.status)
  });
  load_mailbox('inbox');
}

function reply_email(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = email['sender'];
  document.querySelector('#compose-subject').value = `Re: ${email['subject']}`;
  let pre_fill = `\n\n On ${email['timestamp']} ${email['sender']} wrote:\n ---- \n ${email['body']}`;

  document.querySelector('#compose-body').value = pre_fill;
  textarea = document.querySelector('textarea');
  textarea.focus(); //set the focus - cursor at end
  textarea.setSelectionRange(0,0); // place the cursor at the start

  let form = document.querySelector('#compose-form');
  form.addEventListener('submit', processForm);
}