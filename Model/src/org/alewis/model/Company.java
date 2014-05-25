package org.alewis.model;

import java.io.Serializable;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("unused")
public class Company implements Serializable {
	private static final long serialVersionUID = -3580229693121547795L;

	private static final Logger logger = LoggerFactory.getLogger(Company.class);
	
	private String companyName;
	private String catchPhrase;
	private String bs;		// maps to the 'bs' field
	
	public String getCompanyName() {
		return companyName;
	}
	
	public void setCompanyName(String name) {
		this.companyName = name;
	}
	
	public String getCatchPhrase() {
		return catchPhrase;
	}
	
	public void setCatchPhrase(String catchPhrase) {
		this.catchPhrase = catchPhrase;
	}
	
	public String getBs() {
		return bs;
	}
	
	public void setBs(String missionStatement) {
		this.bs = missionStatement;
	}
	
	public String toString() {
		StringBuffer buff = new StringBuffer("--Company--");
		
		buff.append("\t NAME = " + getCompanyName());
		buff.append("\t PHRASE = " + getCatchPhrase());
		buff.append("\t STATEMENT = " + getBs());
		
		return buff.toString();
	}
}
