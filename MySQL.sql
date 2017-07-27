/*
Code to create the database table:
For users:
*/

CREATE TABLE user (
  fname VARCHAR(255) NOT NULL,
  lname VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  zip VARCHAR(255),
  email VARCHAR(255),
  username VARCHAR(255) NOT NULL PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  user_type_id INT DEFAULT 1
);
ALTER TABLE user ADD CONSTRAINT UQ_Name UNIQUE (username);
INSERT INTO user (fname, lname, username, password, user_type_id) VALUES ("Jenny", "Admin", "jadmin", "admin", 2);

/*
Table for usertype
*/
CREATE TABLE usertype (
id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
user_type ENUM('customer', 'admin')
);

INSERT INTO usertype (user_type) VALUES ('customer');
INSERT INTO usertype (user_type) VALUES ('admin');
+----+-----------+
| id | user_type |
+----+-----------+
|  1 | customer  |
|  2 | admin     |
+----+-----------+

/*
 Code to create the database table:
 For products:
*/

CREATE TABLE product(
    asin VARCHAR(255) PRIMARY KEY,
    productName VARCHAR(512) NOT NULL,
    productDescription VARCHAR(2048),
    productGroup VARCHAR(512)
);
ALTER TABLE product ADD CONSTRAINT UQ_Name UNIQUE (asin);

/*
order table
*/
CREATE TABLE user_order (
    username VARCHAR(255),
    productName VARCHAR(512),
    count INT DEFAULT 1
 );
/*
recommendation table
*/
CREATE TABLE recommendation(
    orderDetails VARCHAR(512)
);


/*
Test user tata
*/
INSERT INTO user (fname, lname, address, city, state, zip, email, username, password) VALUES ("Tina", "Bu", "732 S. Millvale Ave", "Pittsburgh", "PA", 15213, "butianhong@outlook.com", "tbu", "tbu");
INSERT INTO user (fname, lname, address, city, state, zip, email, username, password) VALUES ("Tina", "Tiiii", "Center Ave", "Pittsburgh", "PA", 15213, "tiii@outlook.com", "tita", "tita");
INSERT INTO user (fname, lname, username, password, user_type_id) VALUES ("Jenny", "Admin", "jadmin", "admin", 2);

/*
Test product tata
*/
 INSERT INTO product (asin, productName, productDescription, productGroup) VALUES (1, "Laptop", "Macbook 2015", "Electronics");
 INSERT INTO product (asin, productName, productDescription, productGroup) VALUES (2, "Zen and Motorcycle maintenance", "Best selling spiritual book", "Book");
 INSERT INTO product (asin, productName, productDescription, productGroup) VALUES (3, "Grounded Coffee", "Starbucks coffee", "Food");

/*
For testing code to run, delete all from tables first.
*/

DELETE FROM user;
DELETE FROM user_order;
DELETE FROM recommendation;
INSERT INTO user (fname, lname, username, password, user_type_id) VALUES ("Jenny", "Admin", "jadmin", "admin", 2);


 