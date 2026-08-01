-- EXPANDED ASSESSMENT QUESTION BANK
-- Seeding 20+ questions for Python, Java, and SQL across different difficulty levels.

-- Python Questions
INSERT INTO public.assessment_templates (category, question, options, correct_option_index, difficulty) VALUES
('Python', 'What is the output of `print(2 ** 3)`?', '["5", "6", "8", "9"]', 2, 'beginner'),
('Python', 'Which of the following is used to define a block of code in Python?', '["Parentheses", "Indentation", "Curly braces", "Quotation marks"]', 1, 'beginner'),
('Python', 'How do you create a variable with the numeric value 5?', '["x = 5", "int x = 5", "x := 5", "var x = 5"]', 0, 'beginner'),
('Python', 'What is the correct file extension for Python files?', '[".pyth", ".pt", ".py", ".pyt"]', 2, 'beginner'),
('Python', 'Which keyword is used to create a function in Python?', '["func", "define", "def", "function"]', 2, 'beginner'),
('Python', 'What is the output of `len(["apple", "banana", "cherry"])`?', '["2", "3", "4", "Error"]', 1, 'beginner'),
('Python', 'Which collection is ordered, changeable, and allows duplicate members?', '["Set", "Dictionary", "Tuple", "List"]', 3, 'intermediate'),
('Python', 'How do you start a "for" loop in Python?', '["for x in y:", "for x > y:", "for each x in y:", "loop x in y:"]', 0, 'beginner'),
('Python', 'Which method can be used to remove any whitespace from both the beginning and the end of a string?', '["ptrim()", "len()", "strip()", "trim()"]', 2, 'intermediate'),
('Python', 'What is the correct way to create a dictionary in Python?', '["x = {''a'', ''b''}", "x = (''a'': ''b'')", "x = {''a'': ''b''}", "x = [''a'': ''b'']"]', 2, 'intermediate'),
('Python', 'How do you create a comment in Python?', '["// this is a comment", "/* this is a comment */", "# this is a comment", "<!-- this is a comment -->"]', 2, 'beginner'),
('Python', 'Which statement is used to stop a loop?', '["stop", "exit", "break", "return"]', 2, 'beginner'),
('Python', 'What is the output of `type(10)`?', '["<class ''float''>", "<class ''str''>", "<class ''int''>", "<class ''number''>"]', 2, 'beginner'),
('Python', 'Which operator can be used to compare two values?', '["=", "==", "<>", "><"]', 1, 'beginner'),
('Python', 'What is the output of `print("Hello"[0])`?', '["H", "e", "l", "Error"]', 0, 'beginner'),
('Python', 'How do you write a list in Python?', '["(1, 2, 3)", "{1, 2, 3}", "[1, 2, 3]", "<1, 2, 3>"]', 2, 'beginner'),
('Python', 'Which function is used to get user input?', '["get()", "input()", "read()", "scan()"]', 1, 'beginner'),
('Python', 'What is the result of `10 // 3`?', '["3.33", "3", "4", "0"]', 1, 'intermediate'),
('Python', 'How do you find the minimum of two numbers?', '["min(x, y)", "low(x, y)", "smallest(x, y)", "bottom(x, y)"]', 0, 'beginner'),
('Python', 'Which library is commonly used for data analysis in Python?', '["Pandas", "Django", "Flask", "PyQt"]', 0, 'intermediate');

-- Java Questions
INSERT INTO public.assessment_templates (category, question, options, correct_option_index, difficulty) VALUES
('Java', 'What is the entry point of a Java program?', '["start()", "main()", "init()", "run()"]', 1, 'beginner'),
('Java', 'Which keyword is used to create a class in Java?', '["create", "class", "new", "struct"]', 1, 'beginner'),
('Java', 'How do you declare a constant in Java?', '["const", "final", "static", "immutable"]', 1, 'intermediate'),
('Java', 'Which data type is used to create a variable that should store text?', '["String", "Txt", "Char", "string"]', 0, 'beginner'),
('Java', 'What is the output of `System.out.println(10 + 20)`?', '["1020", "30", "Error", "nothing"]', 1, 'beginner'),
('Java', 'Which method is used to find the length of a string in Java?', '["size()", "length()", "len()", "getCount()"]', 1, 'beginner'),
('Java', 'How do you create an object of a class named "MyClass"?', '["MyClass obj = new MyClass();", "class obj = new MyClass();", "new MyClass obj;", "obj = MyClass();"]', 0, 'beginner'),
('Java', 'Which keyword is used to inherit a class in Java?', '["inherits", "implements", "extends", "super"]', 2, 'intermediate'),
('Java', 'What is the default value of a boolean variable in Java?', '["true", "false", "0", "null"]', 1, 'beginner'),
('Java', 'Which access modifier makes a member accessible only within its own class?', '["public", "protected", "private", "default"]', 2, 'beginner'),
('Java', 'How do you start an "if" statement in Java?', '["if x > y then", "if (x > y)", "if x > y:", "if x > y"]', 1, 'beginner'),
('Java', 'Which operator is used to multiply numbers?', '["x", "#", "*", "%"]', 2, 'beginner'),
('Java', 'What is the correct way to declare an array in Java?', '["int[] arr;", "int arr[];", "Both A and B", "int arr();"]', 2, 'intermediate'),
('Java', 'Which keyword is used to refer to the current object?', '["this", "self", "current", "super"]', 0, 'intermediate'),
('Java', 'What is the return type of a method that does not return any value?', '["int", "void", "null", "empty"]', 1, 'beginner'),
('Java', 'Which package is imported by default in every Java program?', '["java.util", "java.io", "java.lang", "java.net"]', 2, 'intermediate'),
('Java', 'What is the size of an int in Java?', '["16 bits", "32 bits", "64 bits", "8 bits"]', 1, 'intermediate'),
('Java', 'Which loop is guaranteed to execute at least once?', '["for", "while", "do-while", "foreach"]', 2, 'intermediate'),
('Java', 'What does JDK stand for?', '["Java Design Kit", "Java Developer Kit", "Java Development Kit", "Java Deployment Kit"]', 2, 'beginner'),
('Java', 'Which keyword is used to handle exceptions?', '["catch", "handle", "try", "throw"]', 2, 'beginner');

-- SQL Questions
INSERT INTO public.assessment_templates (category, question, options, correct_option_index, difficulty) VALUES
('SQL', 'Which SQL statement is used to extract data from a database?', '["GET", "EXTRACT", "SELECT", "OPEN"]', 2, 'beginner'),
('SQL', 'Which SQL statement is used to update data in a database?', '["SAVE", "UPDATE", "MODIFY", "REPLACE"]', 1, 'beginner'),
('SQL', 'Which SQL statement is used to delete data from a database?', '["REMOVE", "DELETE", "COLLAPSE", "TRUNCATE"]', 1, 'beginner'),
('SQL', 'Which SQL statement is used to insert new data in a database?', '["ADD", "INSERT INTO", "SET", "PLACE"]', 1, 'beginner'),
('SQL', 'How do you select a column named "FirstName" from a table named "Persons"?', '["SELECT FirstName FROM Persons", "EXTRACT FirstName FROM Persons", "SELECT Persons.FirstName", "GET FirstName FROM Persons"]', 0, 'beginner'),
('SQL', 'How do you select all the columns from a table named "Persons"?', '["SELECT * FROM Persons", "SELECT [all] FROM Persons", "SELECT Persons", "SELECT *.Persons"]', 0, 'beginner'),
('SQL', 'How do you select all the records from a table named "Persons" where the "FirstName" is "Peter"?', '["SELECT * FROM Persons WHERE FirstName=''Peter''", "SELECT * FROM Persons WHERE FirstName LIKE ''Peter''", "SELECT [all] FROM Persons WHERE FirstName=''Peter''", "SELECT Persons WHERE FirstName=''Peter''"]', 0, 'beginner'),
('SQL', 'Which keyword is used to return only different values?', '["UNIQUE", "DISTINCT", "DIFFERENT", "ONLY"]', 1, 'intermediate'),
('SQL', 'Which SQL keyword is used to sort the result-set?', '["SORT BY", "ORDER BY", "ARRANGE BY", "GROUP BY"]', 1, 'beginner'),
('SQL', 'How can you return all the records from a table named "Persons" sorted descending by "FirstName"?', '["SELECT * FROM Persons ORDER BY FirstName DESC", "SELECT * FROM Persons SORT ''FirstName'' DESC", "SELECT * FROM Persons ORDER FirstName DESC", "SELECT * FROM Persons SORT BY FirstName DESC"]', 0, 'beginner'),
('SQL', 'Which SQL statement is used to return only the first 10 records?', '["SELECT TOP 10", "SELECT FIRST 10", "SELECT LIMIT 10", "DEPENDS ON DB (LIMIT/TOP/FETCH)"]', 3, 'intermediate'),
('SQL', 'How can you return the number of records in the "Persons" table?', '["SELECT COUNT(*) FROM Persons", "SELECT LEN(*) FROM Persons", "SELECT SUM(*) FROM Persons", "SELECT NUMBER(*) FROM Persons"]', 0, 'beginner'),
('SQL', 'What is the most common type of join?', '["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN"]', 0, 'intermediate'),
('SQL', 'Which operator is used to select values within a range?', '["BETWEEN", "RANGE", "WITHIN", "IN"]', 0, 'beginner'),
('SQL', 'The OR operator displays a record if ANY condition listed is true. The AND operator displays a record if ALL conditions listed are true.', '["True", "False", "Partially True", "N/A"]', 0, 'beginner'),
('SQL', 'Which operator is used to search for a specified pattern in a column?', '["SEARCH", "LIKE", "MATCH", "GET"]', 1, 'beginner'),
('SQL', 'Which SQL statement is used to create a table in a database?', '["CREATE TABLE", "MAKE TABLE", "TABLE CREATE", "NEW TABLE"]', 0, 'beginner'),
('SQL', 'What does SQL stand for?', '["Structured Question Language", "Structured Query Language", "Strong Query Language", "Structured Quick Language"]', 1, 'beginner'),
('SQL', 'How do you delete a table named "Persons"?', '["DELETE TABLE Persons", "DROP TABLE Persons", "REMOVE TABLE Persons", "TRUNCATE TABLE Persons"]', 1, 'intermediate'),
('SQL', 'Which constraint is used to uniquely identify each record in a table?', '["UNIQUE", "PRIMARY KEY", "FOREIGN KEY", "NOT NULL"]', 1, 'beginner');
