CREATE TABLE question_type (
    id SERIAL PRIMARY KEY,
    TYPE VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE question (
    id SERIAL PRIMARY KEY,
    TYPE INT NOT NULL,
    QUESTION TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (TYPE) REFERENCES question_type(id)
);

CREATE TABLE answer (
    id SERIAL PRIMARY KEY,
    QUESTION_ID INT NOT NULL,
    ANSWER TEXT NOT NULL,
    USERNAME VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (QUESTION_ID) REFERENCES question(id)
);

INSERT INTO question_type (TYPE) VALUES ('yes_no'), ('multiple_choice'), ('open_ended');
INSERT INTO question (TYPE, QUESTION) VALUES (1, 'Do you like Dutch Milk?'), (2, 'What is your favorite kind of farmer?'), (3, 'Describe the best place to get RAW MILK.');