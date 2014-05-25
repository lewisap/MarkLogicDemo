package org.alewis.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("unused")
public class Address implements Serializable {
	private static final long serialVersionUID = 8510747122712535443L;

	private static final Logger logger = LoggerFactory.getLogger(Address.class);
	
	private String city;
	private String zipcode;
	private String streetA;
	private String streetB;
	private String streetC;
	private String streetD;
//	private String ukCountry;
//	private String ukCounty;
	private String state;
	
	private GeoLocation geo;
	
	
	public String getState() {
		return state;
	}

	public void setState(String state) {
		this.state = state;
	}

	public String getStreetA() {
		return streetA;
	}

	public void setStreetA(String streetA) {
		this.streetA = streetA;
	}

	public String getStreetB() {
		return streetB;
	}

	public void setStreetB(String streetB) {
		this.streetB = streetB;
	}

	public String getStreetC() {
		return streetC;
	}

	public void setStreetC(String streetC) {
		this.streetC = streetC;
	}

	public String getStreetD() {
		return streetD;
	}

	public void setStreetD(String streetD) {
		this.streetD = streetD;
	}

	public String getCity() {
		return city;
	}
	
	public void setCity(String city) {
		this.city = city;
	}
	public String getZipcode() {
		return zipcode;
	}
	
	public void setZipcode(String zip) {
		this.zipcode = zip;
	}
	
	public GeoLocation getGeo() {
		if (geo == null) {
			geo = new GeoLocation();
		}
		
		return geo;
	}

	public void setGeo(GeoLocation geoLocation) {
		this.geo = geoLocation;
	}

	public String toString() {
		StringBuffer buff = new StringBuffer("--Address--");
		
		buff.append("\t CITY = " + getCity());
		buff.append("\t ZIP = " + getZipcode());
		buff.append("\t STREETA = " + getStreetA());
		buff.append("\t STREETB = " + getStreetB());
		buff.append("\t STREETC = " + getStreetC());
		buff.append("\t STREETD = " + getStreetD());
		buff.append("\t STATE = " + getState());
		buff.append(getGeo().toString());
		
		return buff.toString();
	}
}