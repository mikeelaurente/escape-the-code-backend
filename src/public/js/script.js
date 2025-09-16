const EscapeTheCode = (function () {
  ace.require('ace/ext/language_tools');
  const EscapeTheCode = {};

  const vars = {
    story: null,
    allChapters: {},
    allSections: {},
    challenges: [],
    lastSelectedSectionId: '',
    apiUrl: '',
    selectedChallenge: null,
    selectedSection: null,
    converter: new showdown.Converter(),
    editor: null,
    refreshNavOnly: false,
  };

  const dom = {
    container: null,
    sidenav: null,
    sectionContent: null,
    sectionChallenge: null,
    modeSelect: null,
  };

  const ajax = {
    fetchStory: async () => {
      const response = await vars.apiClient.get('/stories');
      const story = response.data[0];
      vars.story = story;

      for (const chapter of story.chapters) {
        for (const section of chapter.sections) {
          vars.challenges = [...vars.challenges, ...section.challenges];
        }
      }
    },
    fetchChallengeHints: async (challengeId) => {
      const response = await vars.apiClient.get(
        '/stories/challenges/' + challengeId + '/hints',
      );
      return response.data;
    },
    submitAnswer: async (challengeId, answer) => {
      const response = await vars.apiClient.post(
        '/stories/challenges/' + challengeId + '/answer',
        {
          answer,
        },
      );
      return response.data;
    },
    buyHint: async (challengeId, hintId) => {
      const response = await vars.apiClient.post(
        '/stories/challenges/' + challengeId + '/buy-hint',
        {
          hintId,
        },
      );
      return response.data;
    },
    runSpell: async (spell) => {
      const response = await vars.apiClient.post('/runner/run', {
        code: btoa(spell),
      });
      return response.data;
    },
  };

  const renderers = {
    displayMainContent: () => {
      const mainContentHTML = `
          <div class="container-fluid p-0">
            <div class="d-flex justify-content-between">
              <h1 class="h3 mb-3 js-section-title"></h1>
              <div class="mb-3 row">
                <label for="mode" class="col-sm-3 col-form-label">Mode</label>
                <div class="col-sm-9" >
                  <select name="mode" id="mode" class="form-control js-mode">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

          <div class="section">
            <div class="accordion" id="accordionPanelsStayOpenExample">
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button js-btn-lesson-accordion"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#panelsStayOpen-collapseOne"
                    aria-expanded="true"
                    aria-controls="panelsStayOpen-collapseOne"
                  >
                    Lesson
                  </button>
                </h2>
                <div
                  id="panelsStayOpen-collapseOne"
                  class="accordion-collapse collapse show"
                >
                  <div class="accordion-body">
                    <div class="section-content"></div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#panelsStayOpen-collapseTwo"
                    aria-expanded="true"
                    aria-controls="panelsStayOpen-collapseTwo"
                  >
                    Challenge
                  </button>
                </h2>
                <div
                  id="panelsStayOpen-collapseTwo"
                  class="accordion-collapse collapse"
                >
                  <div class="accordion-body">
                    <div class="section-challenge"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      `;
      dom.mainContent.innerHTML = mainContentHTML;
    },
    displayChapters: () => {
      let chaptersHTML = '<li class="sidebar-header">Chapters</li>';

      const completedSections = vars.story.progress.map((p) => p.sectionId);
      const allSections = vars.story.chapters
        .map((c) => c.sections)
        .flat()
        .reduce((acc, cur) => {
          acc[cur.id] = cur;
          return acc;
        }, {});
      const allChapters = vars.story.chapters.reduce((acc, cur) => {
        if (cur.id in acc) {
          acc[cur.id].push(...cur.sections);
        } else {
          acc[cur.id] = [...cur.sections];
        }
        return acc;
      }, {});

      vars.allSections = allSections;
      vars.allChapters = allChapters;

      const completedSectionsWithDetails = vars.story.progress.map((c) => {
        if (c.sectionId in allSections) {
          const sectionDetails = allSections[c.sectionId];
          return {
            progress: c,
            details: sectionDetails,
          };
        }
      });

      let lastCompleted = completedSectionsWithDetails
        .map((c) => Number(`${c.details.chapterId}.${c.details.order}`))
        .reduce((a, b) => Math.max(a, b), 0);

      let nextSectionChapter = 1;
      let nextSectionOrder = 1;
      if (lastCompleted > 0) {
        const sectionParts = lastCompleted.toString().split('.');
        nextSectionChapter = Number(sectionParts[0]);
        nextSectionOrder = Number(sectionParts[1]) + 1;
        if (nextSectionChapter in allChapters) {
          if (allChapters[nextSectionChapter].length <= nextSectionOrder) {
            nextSectionOrder = 1;
            nextSectionChapter += 1;
          }
        }
      }

      const nextSection = Object.values(allSections).find(
        (s) => s.order == nextSectionOrder && s.chapterId == nextSectionChapter,
      );

      for (let section of Object.values(vars.allSections)) {
        if (
          nextSection &&
          (section.chapterId > nextSection.chapterId ||
            (nextSection.order < section.order &&
              nextSection.chapterId == section.chapterId))
        ) {
          section.locked = true;
        }
      }

      vars.story.chapters.forEach((chapter) => {
        sections = chapter.sections;

        let sectionItemsHTML = '';
        sections.forEach((section) => {
          let iconHTML = '';

          if (completedSections.indexOf(section.id) > -1) {
            iconHTML += '<i class="fas fa-circle-check text-success"></i>';
          }
          if (section.id in vars.allSections) {
            if (vars.allSections[section.id].locked) {
              iconHTML = `<i class="fas fa-lock"></i>`;
            }
          }
          sectionItemsHTML += `
            <li class="sidebar-item js-sidenav-item">
                <a href="#" data-chapter="${chapter.id}" 
                    data-id="${section.id}"
                    class="sidebar-link js-section js-sidenav-item" 
                > ${iconHTML} ${section.title}</a>

            </li>
        `;
        });

        let sectionsHTML = `
        <ul
            id="chapter-${chapter.id}"
            class="sidebar-dropdown list-unstyled collapse show"
            >
            ${sectionItemsHTML}
        </ul>
        `;

        chaptersHTML += `
            <li class="sidebar-item">
              <a
                data-chapter-id="${chapter.id}"
                data-bs-target="#chapter-${chapter.id}"
                data-bs-toggle="collapse"
                class="sidebar-link collapsed js-chapter"
                >${chapter.title}</a
              >
              ${sectionsHTML}
            </li>
        `;
      });

      dom.sidenav.innerHTML = chaptersHTML;
      dom.sidenav.style.opacity = 0;
      setTimeout(() => {
        window.initializeSimplebar();
        setTimeout(() => {
          Array.prototype.forEach.call(
            document.querySelectorAll('.sidebar-dropdown.show'),
            (list) => {
              list.classList.remove('show');
            },
          );

          dom.sidenav.style.opacity = 1;

          if (vars.lastSelectedSectionId) {
            const sideNavItem = dom.sidenav.querySelector(
              '.js-section[data-id="' + vars.lastSelectedSectionId + '"]',
            );
            if (sideNavItem) {
              sideNavItem.click();

              const chapterId = sideNavItem.getAttribute('data-chapter');

              const sideNavItemParent = dom.sidenav.querySelector(
                '.js-chapter[data-chapter-id="' + chapterId + '"]',
              );
              if (sideNavItemParent) {
                sideNavItemParent.click();
              }
            }
          }
        }, 150);
      }, 50);
    },
    displaySectionRunnables: (runnables) => {
      let html = '';

      html += `<div class="accordion" id="runnableSpell">`;
      runnables.forEach((runnable, i) => {
        let spell = btoa(encodeURIComponent(runnable.code));

        html += `
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${i}" aria-controls="#collapse-${i}">
              ${runnable.title}
            </button>
          </h2>
          <div id="collapse-${i}" class="accordion-collapse collapse" data-bs-parent="#runnableSpell">
            <div class="accordion-body">
              <pre><code>${runnable.code}</code></pre>
              <pre class="js-spell-output-${i}"></pre>
              <div class="d-flex justify-content-end">
                <button data-id="${i}" data-spell="${spell}" class="btn btn-sm btn-bitbucket js-run-spell">
                  <i class="fas fa-play me-1"></i>
                  Run
                </button>
              </div>
            </div>
          </div>
        </div>
        `;
      });
      html += `</div>`;

      if (!runnables || runnables.length === 0) {
        dom.sectionContent.querySelector('#spell').innerHTML =
          'No spell available';
      } else {
        dom.sectionContent.querySelector('#spell').innerHTML = html;
      }
    },
    displaySectionContent: (section) => {
      if (!section) {
        dom.mainContent.innerHTML =
          '<div class="alert alert-warning d-flex justify-content-center">Section not found</div>';
        return;
      }

      if (section.locked) {
        dom.mainContent.innerHTML =
          '<div class="alert alert-warning d-flex justify-content-center">Section is locked</div>';
        return;
      }

      vars.selectedSection = section;

      dom.mainContent.querySelector('.js-section-title').innerHTML =
        `<h2>${section.title}</h2>`;

      let html = ``;
      html += `<p>${section.description}</p>`;

      html += `<div>${vars.converter.makeHtml(section.content)}</div>`;

      dom.sectionContent.innerHTML = html;

      const btnLessonAccordion = dom.mainContent.querySelector(
        '.js-btn-lesson-accordion',
      );
      dom.modeSelect = dom.mainContent.querySelector('#mode');
      if (btnLessonAccordion.classList.contains('collapsed')) {
        dom.btnLessonAccordion.click();
      }

      let runnables = [];
      try {
        runnables = JSON.parse(section.runnables);
      } catch (e) {
        runnables = [];
      }

      renderers.displaySectionRunnables(runnables);

      // find the challenge with the correct mode
      const challenge = section.challenges.find(
        (c) => c.difficulty == dom.modeSelect.value,
      );
      if (!challenge) {
        dom.sectionChallenge = '<h3>No challenge found</h3>';
      } else {
        vars.selectedChallenge = challenge;
        renderers.displayChallenge(challenge);
      }
    },
    displayChallenge: (challenge) => {
      let html = `<h3>${challenge.title}</h3>`;
      html += `<div>${vars.converter.makeHtml(challenge.description)}</div>`;
      html += `<pre id="editor" style='width: 100%; height: 300px;'></pre>`;
      // html += `<textarea id="challenge-answer" class="form-control" rows="5"></textarea>`;
      html += `<hr />`;
      html += `<div id="js-challenge-result"></div>`;
      html += `<div class="challenge-actions d-flex justify-content-center gap-3 border-top pt-3">
                    <button class="btn btn-info js-show-hints ">Show Hints</button>
                    <button class="btn btn-primary js-submit">Submit</button>
                </div>`;
      html += `<div class="continue-section d-flex justify-content-end bg-body-secondary p-3 mt-3 next-level" style="display: none !important;"></div>`;
      dom.sectionChallenge.innerHTML = html;
      vars.editor = ace.edit('editor');
      vars.editor.setTheme('ace/theme/twilight');
      vars.editor.session.setMode('ace/mode/javascript');
      vars.editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: false,
      });
    },
    displayChallengeResult: (result) => {
      const resultDiv = document.getElementById('js-challenge-result');

      let allTestsPassed = false;
      if (result.status === 'ok') {
        allTestsPassed = result.results.every((t) => t.ok);
      }

      const resultHTML = `<h2>Result: ${allTestsPassed ? '<span style="color: green;">PASS</span>' : '<span style="color: red;">FAIL</span>'}</h2>`;

      let testsHTML = '';
      if (result.status === 'ok') {
        testsHTML += '<ul class="mb-0">';

        testsHTML +=
          '<li>' +
          result.results
            .map((r, i) => {
              const testNum = i + 1;
              let testHTML = `[${r.ms}ms] | `;
              if (r.ok) {
                testHTML += `Test ${testNum}: <span style="color:green;">PASSED</span>`;
                return testHTML;
              }

              const method =
                'assert_print' in r
                  ? 'assert_print'
                  : 'assert' in r
                    ? 'assert'
                    : '';
              if (!method) {
                testHTML += `Test ${testNum}: <span style="color:red;">FAILED</span>`;
                return testHTML;
              }

              testHTML += `Test ${testNum}: <span style="color:red;">FAILED</span> - Expected '${r[method].diff.expected}', got '${r[method].diff.actual}'`;
              return testHTML;
            })
            .join('</li><li>') +
          '</li>';

        testsHTML += '</ul>';
      }

      let codeErrorsHTML = '<pre>';

      // Handles Syntax Errors
      if (result.status === 'parse_error') {
        const codeFrameParts = result.codeFrame.split('\n');
        const codeFrameCode = codeFrameParts[0];
        const condeFrameIndicator = (
          ' '.repeat(5 + result.errorLine.toString().length) + codeFrameParts[1]
        ).replaceAll(/\s/g, '&nbsp;');
        codeErrorsHTML += `${codeFrameCode + '<br />' + condeFrameIndicator} at line number ${result.errorLine}, column ${result.errorColumn}`;
      }

      // Handles Reference Error,  Runtime Error and others
      if (result.status === 'ok' && result.results.some((r) => r.error)) {
        const firstError = result.results[0];
        codeErrorsHTML += firstError.error;
      }

      // Handles timeout errors
      if (result.status === 'timeout') {
        codeErrorsHTML += result.detail;
      }

      codeErrorsHTML += '</pre>';

      let html = `<div class="my-2 container p-1"><ul class="nav nav-tabs" id="myTab" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="result-tab" data-bs-toggle="tab" data-bs-target="#result-tab-pane" type="button" role="tab" aria-controls="result-tab-pane" aria-selected="true">Result</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="errors-tab" data-bs-toggle="tab" data-bs-target="#errors-tab-pane" type="button" role="tab" aria-controls="errors-tab-pane" aria-selected="false">Errors ${codeErrorsHTML.length > 0 ? '*' : ''}</button>
        </li>
      </ul>
      <div class="tab-content" id="myTabContent">
        <div class="py-3 tab-pane fade show active" id="result-tab-pane" role="tabpanel" aria-labelledby="result-tab" tabindex="0"><pre class="mb-0">${resultHTML + testsHTML}</pre></div>
        <div class="py-3 tab-pane fade" id="errors-tab-pane" role="tabpanel" aria-labelledby="errors-tab" tabindex="0"><pre>${codeErrorsHTML}</pre></div>
      </div>
      </div>
                    `;
      resultDiv.innerHTML = html;

      if (allTestsPassed) {
        const divContainer =
          dom.sectionChallenge.querySelector('.continue-section');
        divContainer.innerHTML = `
              <button class="btn btn-success btn-lg js-continue ">Next Level</button>

        `;
        divContainer.style.display = 'block';
      }
    },
    displaySpellOutput: (id, results) => {
      let html = '';
      results.forEach((output) => {
        html +=
          `<pre style="background:#111; color:#0f0; padding:10px; border-radius:6px; font-family:monospace;"><code>` +
          output.logs.map((l) => l.args.join()).join('<br />') +
          `</code></pre>`;
      });
      dom.sectionContent.querySelector('.js-spell-output-' + id).innerHTML =
        html;
    },
    displayBoughtHints: (hint) => {
      console.log(hint);
    },
  };

  EscapeTheCode.bindEvents = () => {
    dom.sidenav.addEventListener('click', eventHanders.handleSideNav);
    dom.container.addEventListener('change', eventHanders.handleSelectMode);
    dom.mainContent.addEventListener('click', (e) => {
      console.log(e);
      const target = e.target;
      if (target.classList.contains('js-show-hints')) {
        eventHanders.handleShowHints(target);
      }
      if (target.classList.contains('js-submit')) {
        eventHanders.handleSubmitAnswer(target);
      }
      if (target.classList.contains('js-run-spell')) {
        eventHanders.handleRunSpell(target);
      }
    });
    dom.sidenav.addEventListener(
      'click',
      eventHanders.handleSidenavItemClicked,
    );
    dom.container.addEventListener('click', (e) => {
      const target = e.target;
      if (target.classList.contains('js-buy-hint')) {
        const hintId = target.getAttribute('data-id');
        eventHanders.handleBuyHints(hintId);
      }
    });
  };

  const eventHanders = {
    handleSideNav: (e) => {
      const target = e.target;
      if (!target) return;
      if (vars.refreshNavOnly) {
        return;
      }

      if (target.nodeName === 'BUTTON' || target.closest('button')) {
        const toggleBtn =
          target.nodeName === 'BUTTON' ? target : target.closest('button');
        eventHanders.handleChapter(toggleBtn);
      }
      if (target.nodeName === 'A' && target.classList.contains('js-section')) {
        eventHanders.handleSection(e);
      }
    },

    handleChapter: (btn) => {
      btn.classList.toggle('active');
      let dropdownContent = btn.nextElementSibling;
      if (dropdownContent.style.display === 'block') {
        dropdownContent.style.display = 'none';
      } else {
        dropdownContent.style.display = 'block';
      }
    },

    handleSection: (e) => {
      const sectionTarget = e.target;
      const sectionId = sectionTarget.getAttribute('data-id');
      const section =
        sectionId in vars.allSections ? vars.allSections[sectionId] : null;
      vars.selectedSection = section;
      localStorage.setItem('lastSelectedSection', sectionId);

      renderers.displayMainContent();

      dom.sectionContent = dom.mainContent.querySelector('.section-content');
      dom.sectionChallenge =
        dom.mainContent.querySelector('.section-challenge');

      renderers.displaySectionContent(section);
    },

    handleSelectMode: (e) => {
      const target = e.target;
      if (target.classList.contains('js-mode')) {
        const challenge = vars.selectedSection.challenges.find(
          (c) => c.difficulty == target.value,
        );
        if (challenge) {
          vars.selectedChallenge = challenge;
          renderers.displayChallenge(challenge);
        }
      }
    },

    handleSidenavItemClicked: (e) => {
      const target = e.target;
      if (target.classList.contains('js-sidenav-item')) {
        const sidenavItems = dom.sidenav.querySelectorAll(
          '.js-sidenav-item.bg-dark',
        );
        Array.prototype.forEach.call(sidenavItems, (item) => {
          item.classList.remove('bg-dark');
        });

        if (target.classList.contains('js-section')) {
          target.classList.add('bg-dark');
        }

        const allChapters = dom.sidenav.querySelectorAll('a[data-chapter-id]');
        Array.prototype.forEach.call(allChapters, (item) => {
          item.classList.remove('bg-gradient');
        });

        const chapterId = target.getAttribute('data-chapter');
        const parentChapter = dom.sidenav.querySelector(
          'a[data-chapter-id="' + chapterId + '"]',
        );
        if (parentChapter) {
          parentChapter.classList.add('bg-gradient');
        }
      }
    },

    handleShowHints: async (e) => {
      const hints = await ajax.fetchChallengeHints(vars.selectedChallenge.id);

      let tableHints = '<table class="table">';
      tableHints += `<tr>
                                    <th>Title</th>
                                    <th>Cost</th>
                                    <th>Action</th>
                                  </tr>
                    `;

      hints.forEach((hint) => {
        tableHints += `
                                  <tr>
                                    <td>${hint.displayText}</td>
                                    <td>${hint.cost}</td>
                                    <td><button class="btn btn-success js-buy-hint" data-id="${hint.id}">Buy</button></td>
                                  </tr>`;
      });
      tableHints += '</table>';

      Swal.fire({
        html: tableHints,
        icon: 'question',
        confirmButtonText: 'Close',
      });
    },
    handleSubmitAnswer: async (e) => {
      const codeAnswer = vars.editor.getValue();
      Swal.fire({
        title: 'Are you sure?',
        showCancelButton: true,
        confirmButtonText: 'Submit',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            //get the answer
            const answer = encodeURIComponent(codeAnswer);
            const challengeId = vars.selectedChallenge.id;
            // post answer to api
            const response = await ajax.submitAnswer(challengeId, answer);
            vars.lastSelectedSectionId = vars.selectedSection.id;

            //display response
            renderers.displayChallengeResult(response);
            return response;
          } catch (error) {
            Swal.showValidationMessage(`Request failed: ${error}`);
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      }).then((result, response) => {
        if (result.isConfirmed) {
          if (
            result.value.status === 'ok' &&
            result.value.results.every((x) => x.ok)
          ) {
            Swal.fire({
              title: '✨ Spell Cast!',
              text: 'Your incantation worked perfectly — the quest advances!',
              icon: 'success',
            });
            ajax.fetchStory().then(() => {
              vars.refreshNavOnly = true;
              renderers.displayChapters();
              setTimeout(() => {
                vars.refreshNavOnly = false;
              }, 1500);
            });
          } else {
            Swal.fire({
              title: '🪄 Spell Fizzled!',
              text: 'The magic faltered... check your runes and try again!',
              icon: 'error',
            });
          }
        }
      });
    },
    handleRunSpell: async (target) => {
      let icon = null;
      try {
        const spell = target.getAttribute('data-spell');
        const id = target.getAttribute('data-id');
        let code = atob(spell);

        target.classList.remove('disabled');
        target.classList.add('disabled');

        icon = target.querySelector('i');
        icon.classList.remove('fa-play');
        icon.classList.add('fa-spinner');
        icon.classList.add('fa-spin');

        const response = await ajax.runSpell(code);

        renderers.displaySpellOutput(id, response.results);
      } catch (error) {
        console.log(error);
      } finally {
        target.classList.remove('disabled');
        if (icon) {
          icon.classList.add('fa-play');
          icon.classList.remove('fa-spin');
          icon.classList.remove('fa-spinner');
        }
      }
    },
    handleBuyHints: async (hintId) => {
      Swal.fire({
        title: 'Are you sure?',
        showCancelButton: true,
        confirmButtonText: 'Buy',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            //get the answer
            const challengeId = vars.selectedChallenge.id;
            // post hint to api
            const response = await ajax.buyHint(challengeId, hintId);

            //display response
            renderers.displayBoughtHints(response);
            return response;
          } catch (error) {
            Swal.showValidationMessage(`Request failed: ${error}`);
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      })
        .then((result, response) => {
          if (result.isConfirmed && result.value) {
            const data = result.value;
            if (data.alreadyUsed) {
              Swal.fire({
                icon: 'info',
                title: 'Hint already purchased',
                text: data.hint.hintText,
              });
            } else {
              Swal.fire({
                icon: 'success',
                title: 'Hint purchased!',
                html: `
            <p><strong>Your hint:</strong> ${data.purchasedHint.hintText}</p>
            <p>Remaining credits: ${data.remainingCredits}</p>
          `,
              });
            }
          }
        })
        .catch(() => {
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'Not enough credits to buy this hint.',
          });
        });
    },
  };

  EscapeTheCode.init = ({ container, apiUrl }) => {
    console.log('Init...', container, apiUrl);

    vars.lastSelectedSectionId =
      localStorage.getItem('lastSelectedSection') || '';

    const apiClient = axios.create({
      baseURL: apiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    apiClient.interceptors.request.use(function (config) {
      return config;
    });
    apiClient.interceptors.response.use(function (config) {
      return config;
    });

    vars.apiClient = apiClient;
    dom.container = container;
    dom.sidenav = container.querySelector('.js-sidenav');

    dom.sidenav.innerHTML = '<li class="sidebar-header">Loading...</li>';
    dom.mainContent = container.querySelector('.js-main-content');
    ajax.fetchStory().then(() => {
      renderers.displayChapters();
    });

    EscapeTheCode.bindEvents();
  };

  return {
    init: EscapeTheCode.init,
  };
})();
