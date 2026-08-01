-- PHASE 4: MASSIVE QUESTION EXPANSION
-- Adding 10+ questions for Python, Java, SQL, and Web Development to ensure variety.

-- Python Questions (10 New)
INSERT INTO public.assessment_templates (category, question, options, correct_option_index, difficulty) VALUES
('Python', 'What is a lambda function in Python?', '["A function that runs in a background thread", "An anonymous, one-line function", "A function used for plotting graphs", "A function that handles exceptions"]', 1, 'intermediate'),
('Python', 'Which of these is NOT a built-in Python data type?', '["List", "Dictionary", "Array", "Set"]', 2, 'beginner'),
('Python', 'How do you create a shallow copy of a list `L`?', '["L.copy()", "list(L)", "L[:]", "All of the above"]', 3, 'intermediate'),
('Python', 'What does the `pass` statement do in Python?', '["Exits the program", "Skips the current iteration of a loop", "Does nothing; it is a placeholder", "Returns None from a function"]', 2, 'beginner'),
('Python', 'Which method is used to add an element at the end of a list?', '["add()", "insert()", "append()", "extend()"]', 2, 'beginner'),
('Python', 'What is the purpose of `__init__` in a Python class?', '["To initialize the class attributes", "To import external modules", "To stop the class execution", "To delete the class instance"]', 0, 'intermediate'),
('Python', 'Which of these operators is used for floor division?', '["/", "//", "%", "**"]', 1, 'beginner'),
('Python', 'What is the output of `bool(0)`?', '["True", "False", "None", "Error"]', 1, 'beginner'),
('Python', 'How can you handle multiple exceptions in one except block?', '["except (ValueError, TypeError):", "except ValueError, TypeError:", "except ValueError or TypeError:", "except [ValueError, TypeError]:"]', 0, 'intermediate'),
('Python', 'Which library is used for web scraping in Python?', '["Django", "BeautifulSoup", "Flask", "Matplotlib"]', 1, 'intermediate');

-- Java Questions (10 New)
INSERT INTO public.assessment_templates (category, question, options, correct_option_index, difficulty) VALUES
('Java', 'What is the size of a `char` in Java?', '["8-bit", "16-bit", "32-bit", "64-bit"]', 1, 'intermediate'),
('Java', 'Which keyword is used to prevent a method from being overridden?', '["static", "final", "private", "abstract"]', 1, 'intermediate'),
('Java', 'What is the parent class of all classes in Java?', '["Main", "Class", "Object", "System"]', 2, 'beginner'),
('Java', 'How do you declare a method that belongs to the class rather than an instance?', '["final", "static", "void", "public"]', 1, 'intermediate'),
('Java', 'Which of these is NOT a feature of Java?', '["Pointers", "Object-Oriented", "Platform Independent", "Robust"]', 0, 'beginner'),
('Java', 'What is the use of the `super` keyword?', '["To call the constructor of the parent class", "To call the main method", "To exit a loop", "To create a new object"]', 0, 'intermediate'),
('Java', 'Which interface must a class implement to be serializable?', '["Cloneable", "Comparable", "Serializable", "Runnable"]', 2, 'intermediate'),
('Java', 'What is the result of `5 / 2` in Java if both are integers?', '["2.5", "2", "3", "0"]', 1, 'beginner'),
('Java', 'Which collection class allows null elements and is unsynchronized?', '["Vector", "Hashtable", "ArrayList", "LinkedList"]', 2, 'intermediate'),
('Java', 'What is bytecode in Java?', '["Machine code", "High-level code", "Intermediate code executed by JVM", "Source code"]', 2, 'intermediate');

-- SQL Questions (10 New)
INSERT INTO public.assessment_templates (category, question, options, correct_option_index, difficulty) VALUES
('SQL', 'Which clause is used to filter records in a grouped result?', '["WHERE", "HAVING", "FILTER", "GROUP BY"]', 1, 'intermediate'),
('SQL', 'What is the difference between TRUNCATE and DELETE?', '["DELETE is faster", "TRUNCATE cannot be rolled back", "DELETE removes the table structure", "TRUNCATE removes specific rows"]', 1, 'advanced'),
('SQL', 'Which command is used to change the structure of a table?', '["MODIFY TABLE", "UPDATE TABLE", "ALTER TABLE", "CHANGE TABLE"]', 2, 'intermediate'),
('SQL', 'What does the UNION operator do?', '["Combines the result of two SELECT statements", "Joins two tables based on a key", "Filters unique records only", "Intersects two result sets"]', 0, 'intermediate'),
('SQL', 'Which integrity constraint prevents null values in a column?', '["UNIQUE", "PRIMARY KEY", "NOT NULL", "CHECK"]', 2, 'beginner'),
('SQL', 'Which join returns all records from the left table and matched records from the right?', '["INNER JOIN", "RIGHT JOIN", "LEFT JOIN", "FULL JOIN"]', 2, 'beginner'),
('SQL', 'What is a FOREIGN KEY?', '["A key that uniquely identifies a record in the same table", "A field that links two tables together", "A key used for encryption", "A primary key of another table"]', 1, 'intermediate'),
('SQL', 'Which function is used to find the average value of a numeric column?', '["SUM()", "AVG()", "MEAN()", "COUNT()"]', 1, 'beginner'),
('SQL', 'Which keyword is used to create a virtual table based on a result-set?', '["STORED PROCEDURE", "VIEW", "TRIGGER", "INDEX"]', 1, 'intermediate'),
('SQL', 'What is an INDEX used for in SQL?', '["To store data", "To speed up data retrieval", "To encrypt data", "To join tables"]', 1, 'intermediate');

-- Web Development Bonus (10 New)
INSERT INTO public.assessment_templates (category, question, options, correct_option_index, difficulty) VALUES
('Web Development', 'What is the purpose of the `alt` attribute in an `<img>` tag?', '["To style the image", "To provide alternative text for accessibility", "To set the image source", "To link the image"]', 1, 'beginner'),
('Web Development', 'Which CSS property controls the text size?', '["font-style", "text-size", "font-size", "text-style"]', 2, 'beginner'),
('Web Development', 'What does DOM stand for?', '["Data Object Model", "Document Object Model", "Digital Object Model", "Direct Object Model"]', 1, 'intermediate'),
('Web Development', 'Which HTML tag is used for the largest heading?', '["<head>", "<h6>", "<h1>", "<header>"]', 2, 'beginner'),
('Web Development', 'How do you select an element with id "demo" in CSS?', '["#demo", ".demo", "demo", "*demo"]', 0, 'beginner'),
('Web Development', 'Which JavaScript method is used to write into the browser console?', '["console.print()", "console.log()", "console.write()", "console.output()"]', 1, 'beginner'),
('Web Development', 'What is the default value of the `position` property in CSS?', '["relative", "absolute", "fixed", "static"]', 3, 'intermediate'),
('Web Development', 'Which HTML element is used to specify a footer for a document or section?', '["<bottom>", "<section>", "<footer>", "<aside>"]', 2, 'beginner'),
('Web Development', 'In CSS, what does `z-index` control?', '["The zoom level", "The stack order of elements", "The horizontal position", "The vertical position"]', 1, 'intermediate'),
('Web Development', 'What is the purpose of the JSON.stringify() method?', '["To parse a JSON string", "To convert a JavaScript object to a JSON string", "To format a JSON object", "To encrypt a JSON string"]', 1, 'intermediate');
