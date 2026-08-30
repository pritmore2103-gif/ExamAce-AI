import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { generateMCQ } from "../services/api";

export default function Quiz() {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState([]);

  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);

  const [selected, setSelected] = useState("");
  const [finished, setFinished] = useState(false);
  
  const startQuiz = async () => {
    const data = await generateMCQ(
      topic,
      "Medium",
      10
    );

    setQuestions(data.questions);
    setCurrent(0);
    setScore(0);
    setFinished(false);
  };

  const nextQuestion = () => {
    const correct =
      questions[current].answer;

    if (selected === correct) {
      setScore(score + 1);
    }

    setSelected("");

    if (
      current + 1 === questions.length
    ) {
      setFinished(true);
    } else {
      setCurrent(current + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      <Sidebar />

      <div className="flex-1 p-8">

        <h1 className="text-4xl font-bold mb-8">
          🎯 Quiz Mode
        </h1>

        {questions.length === 0 && (
          <div className="bg-slate-900 p-6 rounded-2xl">

            <input
              type="text"
              placeholder="Enter Topic"
              value={topic}
              onChange={(e) =>
                setTopic(e.target.value)
              }
              className="w-full p-3 rounded-xl bg-slate-800 mb-4"
            />

            <button
              onClick={startQuiz}
              className="bg-blue-600 px-6 py-3 rounded-xl"
            >
              Start Quiz
            </button>

          </div>
        )}

        {questions.length > 0 &&
          !finished && (
            <div className="bg-slate-900 p-6 rounded-2xl">

              <h2 className="text-xl mb-6">
                Question {current + 1} of{" "}
                {questions.length}
              </h2>

              <p className="text-lg mb-6">
                {
                  questions[current]
                    .question
                }
              </p>

              <div className="space-y-3">

                {questions[
                  current
                ].options.map(
                  (option, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        setSelected(
                          ["A", "B", "C", "D"][
                            index
                          ]
                        )
                      }
                      className={`w-full text-left p-3 rounded-xl ${
                        selected ===
                        [
                          "A",
                          "B",
                          "C",
                          "D",
                        ][index]
                          ? "bg-blue-600"
                          : "bg-slate-800"
                      }`}
                    >
                      {option}
                    </button>
                  )
                )}

              </div>

              <button
                onClick={nextQuestion}
                className="mt-6 bg-green-600 px-6 py-3 rounded-xl"
              >
                Next
              </button>

            </div>
          )}

        {finished && (
          <div className="bg-slate-900 p-8 rounded-2xl">

            <h2 className="text-3xl font-bold mb-4">
              Quiz Complete 🎉
            </h2>

            <p className="text-xl">
              Score: {score}/
              {questions.length}
            </p>

            <p className="text-xl mt-2">
              Percentage:
              {" "}
              {Math.round(
                (score /
                  questions.length) *
                  100
              )}
              %
            </p>

          </div>
        )}

      </div>

    </div>
  );
}


