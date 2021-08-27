create database test_crawler;

create table test_crawler.requires (
	id integer not null auto_increment,
	search varchar(255),
    idCrawler varchar(31),
    status varchar(15),
    
    primary key (id)
);