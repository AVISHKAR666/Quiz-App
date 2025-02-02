document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const startBtn = document.getElementById("start-btn");
    const quizScreen = document.getElementById("quiz-screen");
    const startScreen = document.getElementById("start-screen");
    const resultScreen = document.getElementById("result-screen");
    const questionText = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    const timerDisplay = document.getElementById("timer");
    const countdownOverlay = document.getElementById("countdown-overlay");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const submitBtn = document.getElementById("submit-btn");
    const restartBtn = document.getElementById("restart-btn");
    const metricsContainer = document.getElementById("metrics");
    const detailsContainer = document.getElementById("details");
  
    // For progress bar (if needed)
    const progressBar = document.createElement("div");
    progressBar.id = "progress-bar";
    document.body.insertBefore(progressBar, quizScreen);
  
    // Quiz state variables
    let currentQuestionIndex = 0;
    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let questions = [];
    let overallTimeLeft = 15 * 60; // 15 minutes in seconds
    let overallTimer;
  
    // Sound effects
    // const correctSound = new Audio("./correct-6033.mp3");
    const correctSound = new Audio("./sound-effect/correct-6033.mp3");
    const wrongSound = new Audio("./sound-effect/wronganswer-37702.mp3");
  
    // Fetch questions from API
    function fetchQuestions() {
      fetch("https://api.allorigins.win/get?url=" + encodeURIComponent("https://api.jsonserve.com/Uw5CrX"))
        .then((response) => response.json())
        .then((data) => {
          console.log("📥 Raw API Response:", data);
          const parsedData = JSON.parse(data.contents);
  
          if (parsedData.questions && Array.isArray(parsedData.questions)) {
            // Map questions and add a field to store user answer if needed.
            questions = parsedData.questions.map((q) => ({
              question: q.description,
              options: q.options.map((opt) => opt.description),
              correct: q.options.find((opt) => opt.is_correct)?.description,
              selected: null // to store user's answer later
            }));
            console.log("✅ Parsed Questions:", questions);
          } else {
            throw new Error("Invalid JSON structure");
          }
        })
        .catch((error) => {
          console.error("❌ Error fetching data:", error);
          alert("Failed to load quiz data. Please try again.");
        });
    }
  
    // Call fetchQuestions when page loads
    fetchQuestions();
  
    // Start Button: first trigger countdown animation then start quiz
    startBtn.addEventListener("click", () => {
      if (questions.length === 0) {
        alert("Quiz data is still loading. Please wait...");
        return;
      }
      // Hide start screen and start countdown
      startScreen.style.display = "none";
      startCountdown();
    });
  
    // Countdown Animation (3, 2, 1, Go)
    function startCountdown() {
      const countdownSequence = ["3", "2", "1", "Go"];
      let count = 0;
      countdownOverlay.style.display = "flex";
  
      const countdownInterval = setInterval(() => {
        countdownOverlay.textContent = countdownSequence[count];
        count++;
        if (count === countdownSequence.length) {
          clearInterval(countdownInterval);
          setTimeout(() => {
            countdownOverlay.style.display = "none";
            startQuiz();
          }, 1000);
        }
      }, 1000);
    }
  
    // Start the quiz: show quiz screen and start overall timer
    function startQuiz() {
      quizScreen.style.display = "block";
      currentQuestionIndex = 0;
      updateProgressBar();
      loadQuestion();
      startOverallTimer();
    }
  
    // Overall Timer: counts down from 15 minutes
    function startOverallTimer() {
      updateTimerDisplay();
      overallTimer = setInterval(() => {
        overallTimeLeft--;
        updateTimerDisplay();
        if (overallTimeLeft <= 0) {
          clearInterval(overallTimer);
          showResults();
        }
      }, 1000);
    }
  
    // Format time as MM:SS
    function updateTimerDisplay() {
      const minutes = Math.floor(overallTimeLeft / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (overallTimeLeft % 60).toString().padStart(2, "0");
      timerDisplay.textContent = `Time Left: ${minutes}:${seconds}`;
    }
  
    // Navigation button event listeners
    prevBtn.addEventListener("click", () => {
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
      }
    });
  
    nextBtn.addEventListener("click", () => {
      if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
      }
    });
  
    submitBtn.addEventListener("click", () => {
      showResults();
    });
  
    restartBtn.addEventListener("click", () => {
      location.reload();
    });
  
    // Load the current question; if already answered, mark selected option.
    function loadQuestion() {
      // Update progress bar
      updateProgressBar();
  
      const currentQuestion = questions[currentQuestionIndex];
  
      if (!currentQuestion || !currentQuestion.question) {
        console.error("❌ Error loading question", currentQuestion);
        alert("An error occurred while loading the question. Please try restarting.");
        return;
      }
  
      questionText.textContent = `Question ${currentQuestionIndex + 1}/${questions.length}: ${currentQuestion.question}`;
      optionsContainer.innerHTML = "";
  
      // Option labels A, B, C, D
      const optionLabels = ["A", "B", "C", "D"];
  
      currentQuestion.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.textContent = `${optionLabels[index]}. ${option}`;
        button.classList.add("option");
  
        // If already answered, show the result and disable changes
        if (currentQuestion.selected !== null) {
          button.disabled = true;
          if (option === currentQuestion.correct) {
            button.style.backgroundColor = "#28a745"; // correct
          }
          if (option === currentQuestion.selected && currentQuestion.selected !== currentQuestion.correct) {
            button.style.backgroundColor = "#dc3545"; // wrong
          }
        } else {
          // Allow answer selection
          button.addEventListener("click", () => selectAnswer(button, option, currentQuestion.correct));
        }
        optionsContainer.appendChild(button);
      });
  
      // Update navigation button visibility:
      // Previous button hidden on first question
      prevBtn.style.display = currentQuestionIndex === 0 ? "none" : "inline-block";
      // For last question, hide Next button and show Submit button.
      if (currentQuestionIndex === questions.length - 1) {
        nextBtn.style.display = "none";
        submitBtn.style.display = "inline-block";
      } else {
        nextBtn.style.display = "inline-block";
        submitBtn.style.display = "none";
      }
    }
  
    // Handle answer selection
    function selectAnswer(button, selectedOption, correctOption) {
      // If question already answered, do nothing.
      if (questions[currentQuestionIndex].selected !== null) return;
  
      // Store the user's answer
      questions[currentQuestionIndex].selected = selectedOption;
  
      // Disable all option buttons
      const buttons = document.querySelectorAll(".option");
      buttons.forEach((btn) => (btn.disabled = true));
  
      if (selectedOption === correctOption) {
        button.style.backgroundColor = "#28a745";
        score += 4; // +4 points for correct answer
        correctAnswers++;
        correctSound.play();
        celebrate();
      } else {
        button.style.backgroundColor = "#dc3545";
        score -= 1; // -1 point for wrong answer
        wrongAnswers++;
        wrongSound.play();
      }
    }
  
    // Show results screen and display metrics
    function showResults() {
      // Stop overall timer if still running.
      clearInterval(overallTimer);
      quizScreen.style.display = "none";
      resultScreen.style.display = "block";
  
      // Calculate Accuracy and Speed:
      // Accuracy as % of correct answers out of total questions.
      const accuracy = ((correctAnswers / questions.length) * 100).toFixed(2);
      // Speed based on remaining time (out of 100).
      const speed = ((overallTimeLeft / (15 * 60)) * 100).toFixed(2);
  
      // Metrics row (one line)
      metricsContainer.innerHTML = `
        <div>Accuracy: ${accuracy}%</div>
        <div>Speed: ${speed}/100</div>
        <div>Total Score: ${score}</div>
      `;
  
      // Details row: Questions, Correct, Incorrect
      detailsContainer.innerHTML = `
        <div>Questions: ${questions.length}</div>
        <div>Correct: ${correctAnswers}</div>
        <div>Incorrect: ${wrongAnswers}</div>
      `;
    }
  
    // Update progress bar based on current question
    function updateProgressBar() {
      const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
      progressBar.style.width = `${progress}%`;
    }
  
    // Celebration confetti effect on correct answer
    function celebrate() {
      const numConfetti = 50;
      const colors = ["#ff6347", "#32cd32", "#1e90ff", "#ff4500", "#d2691e"];
  
      for (let i = 0; i < numConfetti; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.animationDuration = `${Math.random() * 1 + 1}s`;
        document.body.appendChild(confetti);
  
        setTimeout(() => {
          confetti.remove();
        }, 1000);
      }
  
      // Optional: play an additional celebration sound
      const celebrationSound = new Audio("./correct-6033.mp3");
      celebrationSound.play();
    }
  });
  