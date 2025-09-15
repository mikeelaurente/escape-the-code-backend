const EscapeTheCode = (function () {
  ace.require('ace/ext/language_tools');
  const EscapeTheCode = {};

  const vars = {
    story: null,
    challenges: [],
    apiUrl: '',
    selectedChallenge: null,
    converter: new showdown.Converter(),
    editor: null,
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
      console.log(response.data);
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
    displayChapters: () => {
      let chaptersHTML = '<li class="sidebar-header">Chapters</li>';
      vars.story.chapters.forEach((chapter) => {
        sections = chapter.sections;

        let sectionItemsHTML = '';
        sections.forEach((section) => {
          sectionItemsHTML += `
            <li class="sidebar-item js-sidenav-item">
                <a href="#" data-chapter="${chapter.id}" 
                    data-id="${section.id}"
                    class="sidebar-link js-section js-sidenav-item" 
                >${section.title}</a>
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
                class="sidebar-link collapsed"
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
      let html = `<h2>${section.title}</h2>`;
      html += `<p>${section.description}</p>`;

      console.log(section);
      html += `<div>${vars.converter.makeHtml(section.content)}</div>`;

      dom.sectionContent.innerHTML = html;

      if (dom.btnLessonAccordion.classList.contains('collapsed')) {
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
      console.log('displayChallenge CALLED');
      let html = `<h3>${challenge.title}</h3>`;
      html += `<div>${vars.converter.makeHtml(challenge.description)}</div>`;
      html += `<pre id="editor" style='width: 100%; height: 300px;'></pre>`;
      // html += `<textarea id="challenge-answer" class="form-control" rows="5"></textarea>`;
      html += `<hr />`;
      html += `<div id="js-challenge-result"></div>`;
      html += `<div class="challenge-actions d-flex justify-content-between">
                    <button class="btn btn-info js-show-hints ">Show Hints</button>
                    <button class="btn btn-primary js-submit">Submit</button>
                </div>`;
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
        testsHTML += '<ul>';

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
        <div class="py-3 tab-pane fade show active" id="result-tab-pane" role="tabpanel" aria-labelledby="result-tab" tabindex="0"><pre>${resultHTML + testsHTML}</pre></div>
        <div class="py-3 tab-pane fade" id="errors-tab-pane" role="tabpanel" aria-labelledby="errors-tab" tabindex="0"><pre>${codeErrorsHTML}</pre></div>
      </div>
      </div>
                    `;

      resultDiv.innerHTML = html;

      /*\
                    {
          "codeOutput": "Test\nHello There World\ntesting is not defined function error",
          "result": "failed",
          "syntaxErrors": [
              {
                  "code": "cnsol.log(\"Test\");",
                  "lineNumber": 1,
                  "columnNumber": 1
              },
              {
                  "code": "console.lg(\"testing\");",
                  "lineNumber": 3,
                  "columnNumber": 1
              }
          ]
      }*/
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
  };

  EscapeTheCode.bindEvents = () => {
    dom.sidenav.addEventListener('click', eventHanders.handleSideNav);
    dom.container.addEventListener('change', eventHanders.handleSelectMode);
    dom.sectionChallenge.addEventListener('click', (e) => {
      console.log(e);
      const target = e.target;
      if (target.classList.contains('js-show-hints')) {
        eventHanders.handleShowHints(target);
      }
      if (target.classList.contains('js-submit')) {
        eventHanders.handleSubmitAnswer(target);
      }
    });
    dom.sidenav.addEventListener(
      'click',
      eventHanders.handleSidenavItemClicked,
    );
    dom.sectionContent.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target;
      if (target.classList.contains('js-run-spell')) {
        eventHanders.handleRunSpell(target);
      }
    });
  };

  const eventHanders = {
    handleSideNav: (e) => {
      console.log(e.target);
      const target = e.target;
      if (!target) return;

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
      const chapterId = sectionTarget.getAttribute('data-chapter');
      const sectionId = sectionTarget.getAttribute('data-id');

      const chapter = vars.story.chapters.find((c) => c.id == chapterId);

      const section = chapter.sections.find((s) => s.id == sectionId);
      vars.selectedSection = section;

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
      console.log(vars.selectedChallenge);
    },
    handleSubmitAnswer: async (e) => {
      const codeAnswer = vars.editor.getValue();
      console.log('codeAnswer', codeAnswer);
      Swal.fire({
        title: 'Are you sure?',
        showCancelButton: true,
        confirmButtonText: 'Submit',
        showLoaderOnConfirm: true,
        preConfirm: async (login) => {
          try {
            //get the answer
            const answer = encodeURIComponent(codeAnswer);
            const challengeId = vars.selectedChallenge.id;
            // post answer to api
            const response = await ajax.submitAnswer(challengeId, answer);

            //display response
            renderers.displayChallengeResult(response);
            return response;
          } catch (error) {
            Swal.showValidationMessage(`Request failed: ${error}`);
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      }).then((result, response) => {
        console.log(result, response);
        if (result.isConfirmed) {
          if (
            result.value.status === 'ok' &&
            result.value.results.every((x) => x.ok)
          ) {
            Swal.fire({
              title: 'Yey!',
              text: 'Great job!',
              icon: 'success',
            });
          } else {
            Swal.fire({
              title: 'Ooops!',
              text: 'Try again.!',
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
        console.log('response', response);

        renderers.displaySpellOutput(id, response.results);
      } catch (error) {
        console.log(error);
        alert('error');
      } finally {
        target.classList.remove('disabled');
        if (icon) {
          icon.classList.add('fa-play');
          icon.classList.remove('fa-spin');
          icon.classList.remove('fa-spinner');
        }
      }
    },
  };

  EscapeTheCode.init = ({ container, apiUrl }) => {
    console.log('Init...', container, apiUrl);

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

    dom.btnLessonAccordion = container.querySelector(
      '.js-btn-lesson-accordion',
    );
    dom.modeSelect = container.querySelector('#mode');
    dom.sectionContent = container.querySelector('.section-content');
    dom.sectionChallenge = container.querySelector('.section-challenge');
    ajax.fetchStory().then(() => {
      renderers.displayChapters();
    });

    EscapeTheCode.bindEvents();
  };

  return {
    init: EscapeTheCode.init,
  };
})();
