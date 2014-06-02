package org.alewis.model;

import java.io.Serializable;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

@SuppressWarnings("unused")
public class Person implements Serializable {
	private static final long serialVersionUID = 1759395371294641641L;

	private static final Logger logger = LoggerFactory.getLogger(Person.class);
	
	private String uri;
	private String name;
	private String username;
	private String email;
	private String phone;
	private String website;
	
	private Address address;
	private Company company;
	
	public String getUri() {
		return uri;
	}

	public void setUri(String uri) {
		this.uri = uri;
	}
	
	public String getName() {
		return name;
	}
	
	public void setName(String name) {
		this.name = name;
	}
	public String getUsername() {
		return username;
	}
	
	public void setUsername(String username) {
		this.username = username;
	}
	
	public String getEmail() {
		return email;
	}
	
	public void setEmail(String email) {
		this.email = email;
	}
	
	public String getPhone() {
		return phone;
	}
	
	public void setPhone(String phone) {
		this.phone = phone;
	}
	
	public String getWebsite() {
		return website;
	}
	
	public void setWebsite(String website) {
		this.website = website;
	}
	
	public Address getAddress() {
		if (address == null) {
			address = new Address();
		}
		
		return address;
	}
	
	public void setAddress(Address address) {
		this.address = address;
	}
	
	public Company getCompany() {
		if (company == null) {
			company = new Company();
			
		}
		return company;
	}
	
	public void setCompany(Company company) {
		this.company = company;
	}
	
	public String toString() {
		StringBuffer buff = new StringBuffer("--Person--");
		
		buff.append("\t NAME = " + getName());
		buff.append("\t USERNAME = " + getUsername());
		buff.append("\t EMAIL = " + getEmail());
		buff.append("\t PHONE = " + getPhone());
		buff.append("\t WEBSITE = " + getWebsite());
		
		buff.append(getAddress().toString());
		buff.append(getCompany().toString());
		
		return buff.toString();
	}
}
