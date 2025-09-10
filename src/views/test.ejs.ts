// setTimeout(() => {
//   (async function () {
//     const usersDiv = document.querySelector('#users');
//     const storiesDiv = document.querySelector('#stories');
//     const chaptersDiv = document.querySelector('#chapters');
//     const sectionsDiv = document.querySelector('#sections');
//     const btnAddUser = document.querySelector('#btnAddUser');
//     const frmAddUser = document.querySelector('#frmAddUser');
//     const sidenav = document.querySelector('.sidenav');
//     const main = document.querySelector('.main');
//     const mode = document.querySelector('#mode');
//     const sectionDiv = document.querySelector('#section');

//     const fetchUsers = async () => {
//       const response = await axios('http://localhost:3000/api/users');
//       let list = '<ul>';
//       response.data.forEach((element) => {
//         list += '<li> ' + element.email + '</li>';
//       });
//       list += '</ul>';
//       usersDiv.innerHTML = list;
//     };

//     //fetchUsers();

//     const fetchStories = async () => {
//       const stories = await axios('http://localhost:3000/api/stories');
//       const chapters = stories.data[0].chapters;
//       const sections = chapters[0].sections;

//       let list = '<ul>';
//       stories.data.forEach((element) => {
//         list += '<li> ' + element.title + '</li>';
//       });
//       list += '</ul>';
//       storiesDiv.innerHTML = list;

//       list = '<ul>';
//       chapters.forEach((element) => {
//         list += '<li> ' + element.title + '</li>';
//       });
//       list += '</ul>';
//       chaptersDiv.innerHTML = list;

//       list = '<ul>';
//       sections.forEach((element) => {
//         list += '<li> ' + element.title + '</li>';
//       });
//       list += '</ul>';
//       sectionsDiv.innerHTML = list;
//     };

//     //fetchStories();

//     let stories = [];

//     const generateSidenav = async () => {
//       const response = await axios('http://localhost:3000/api/stories');
//       stories = response.data[0];
//       chapters = stories.chapters;

//       let list = '';
//       chapters.forEach((chapter) => {
//         sections = chapter.sections;

//         list += `<button class="dropdown-btn"> ${chapter.title}`;
//         list += `<i class="fa fa-caret-down"></i></button>`;
//         list += `<div class="dropdown-container">`;

//         sections.forEach((section) => {
//           list += `<a href="#">${section.title}</a>`;
//         });

//         list += `</div>`;
//       });

//       sidenav.innerHTML = list;
//     };

//     sidenav.addEventListener('click', function (e) {
//       if (e.target && e.target.nodeName === 'BUTTON') {
//         e.target.classList.toggle('active');
//         let dropdownContent = e.target.nextElementSibling;
//         if (dropdownContent.style.display === 'block') {
//           dropdownContent.style.display = 'none';
//         } else {
//           dropdownContent.style.display = 'block';
//         }
//       }

//       if (e.target && e.target.nodeName === 'A') {
//         sectionDiv.innerHTML = `<h2 class="sectionTitle">${e.target.innerText}</h2>`;

//         mode.innerHTML = `<select name="modeSelect" class="modeSelect">
//                                   <option value="none">Select option</option>
//                                   <option value="easy">Easy</option>
//                                   <option value="medium">Medium</option>
//                                   <option value="hard">Hard</option>
//                                 </select>

//                                 <div class="challenge"></div>`;
//       }
//     });

//     mode.addEventListener('change', function (e) {
//       chapters = stories.chapters;
//       chapters.forEach((chapter) => {
//         sections = chapter.sections;
//         sections.forEach((section) => {
//           if (
//             section.title === document.querySelector('.sectionTitle').innerText
//           ) {
//             challenges = section.challenges;

//             challenges.forEach((challenge) => {
//               if (challenge.difficulty === e.target.value) {
//                 document.querySelector('#challenge').innerHTML =
//                   `<div class="challenges">
//                                                   <h3>${challenge.title}</h3>
//                                                   <p>${challenge.description}</p>
//                                                   <p>Difficulty: ${challenge.difficulty}</p>
//                                                 </div>`;
//               }
//             });
//           }
//         });
//       });
//     });

//     generateSidenav();

//     // btnAddUser.addEventListener('click', async (event) => {
//     //   event.stopPropagation();

//     //   const { data } = await axios.post('/api/users', frmAddUser, {
//     //     headers: {
//     //       'Content-Type': 'application/json',
//     //     },
//     //   });
//     //   await fetchUsers();
//     // });
//   })();
// }, 1500);
