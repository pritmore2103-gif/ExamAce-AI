const API_URL = "https://examace-ai-cp3e.onrender.com";


// ============================================================
// REGISTER
// ============================================================

export async function registerUser(data) {

  const response = await fetch(
    `${API_URL}/register`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    }
  );

  return response.json();
}


// ============================================================
// VERIFY OTP
// ============================================================

export async function verifyOTP(email, otp) {

  const response = await fetch(
    `${API_URL}/verify-otp`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email,
        otp,
      }),
    }
  );

  return response.json();
}


// ============================================================
// RESEND OTP
// ============================================================

export async function resendOTP(email) {

  const response = await fetch(
    `${API_URL}/resend-otp`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email,
      }),
    }
  );

  return response.json();
}


// ============================================================
// LOGIN
// ============================================================

export async function loginUser(data) {

  const response = await fetch(
    `${API_URL}/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    }
  );

  return response.json();
}


// ============================================================
// SAVE NOTE
// ============================================================

export async function saveNote(
  title,
  content
) {

  const token =
    localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/notes`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify({
        title,
        content,
      }),
    }
  );

  return response.json();
}


// ============================================================
// GET NOTES
// ============================================================

export async function getNotes() {

  const token =
    localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/notes`,
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return response.json();
}


// ============================================================
// MCQ GENERATOR
// ============================================================

export async function generateMCQ(
  topic,
  difficulty,
  count,
  subject = "General",
  exam = "General"
) {

  const response = await fetch(
    `${API_URL}/generate-mcq`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({

        topic,

        difficulty,

        count,

        subject,

        exam,

      }),
    }
  );


  if (!response.ok) {

    let errorMessage =
      "Failed to generate MCQs.";

    try {

      const errorData =
        await response.json();

      if (errorData.detail) {
        errorMessage =
          errorData.detail;
      }

    } catch (error) {

      console.error(
        "Could not read error response:",
        error
      );

    }

    throw new Error(
      errorMessage
    );
  }


  return response.json();
}


// ============================================================
// SAVE QUIZ
// ============================================================

export async function saveQuiz(data) {

  const token =
    localStorage.getItem("token");


  const response = await fetch(
    `${API_URL}/save-quiz`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(data),
    }
  );


  if (!response.ok) {

    let errorMessage =
      "Failed to save quiz.";

    try {

      const errorData =
        await response.json();

      if (errorData.detail) {

        errorMessage =
          errorData.detail;

      }

    } catch (error) {

      console.error(
        "Could not read save quiz error:",
        error
      );

    }

    throw new Error(
      errorMessage
    );
  }


  return response.json();
}


// ============================================================
// GET SAVED QUIZZES
// ============================================================

export async function getSavedQuizzes() {

  const token =
    localStorage.getItem("token");


  const response = await fetch(
    `${API_URL}/saved-quizzes`,
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


  if (!response.ok) {

    let errorMessage =
      "Failed to load saved quizzes.";

    try {

      const errorData =
        await response.json();

      if (errorData.detail) {

        errorMessage =
          errorData.detail;

      }

    } catch (error) {

      console.error(
        "Could not read saved quizzes error:",
        error
      );

    }

    throw new Error(
      errorMessage
    );
  }


  return response.json();
}


// ============================================================
// GET ONE SAVED QUIZ
// ============================================================

export async function getSavedQuiz(
  quizId
) {

  const token =
    localStorage.getItem("token");


  const response = await fetch(
    `${API_URL}/saved-quizzes/${quizId}`,
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


  if (!response.ok) {

    let errorMessage =
      "Failed to load quiz.";

    try {

      const errorData =
        await response.json();

      if (errorData.detail) {

        errorMessage =
          errorData.detail;

      }

    } catch (error) {

      console.error(
        "Could not read quiz error:",
        error
      );

    }

    throw new Error(
      errorMessage
    );
  }


  return response.json();
}


// ============================================================
// DELETE SAVED QUIZ
// ============================================================

export async function deleteSavedQuiz(
  quizId
) {

  const token =
    localStorage.getItem("token");


  const response = await fetch(
    `${API_URL}/saved-quizzes/${quizId}`,
    {
      method: "DELETE",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


  if (!response.ok) {

    let errorMessage =
      "Failed to delete quiz.";

    try {

      const errorData =
        await response.json();

      if (errorData.detail) {

        errorMessage =
          errorData.detail;

      }

    } catch (error) {

      console.error(
        "Could not read delete quiz error:",
        error
      );

    }

    throw new Error(
      errorMessage
    );
  }


  return response.json();
}


// ============================================================
// AI NOTES
// ============================================================

export async function generateNotes(
  topic
) {

  const response = await fetch(
    `${API_URL}/generate-notes`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        topic,
      }),
    }
  );

  return response.json();
}


// ============================================================
// DASHBOARD
// ============================================================

export async function getDashboard() {

  const token =
    localStorage.getItem("token");


  const response = await fetch(
    `${API_URL}/dashboard`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


  return response.json();
}
