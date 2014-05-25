package org.alewis.model;

import java.io.Serializable;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("unused")
public class GeoLocation implements Serializable {
	private static final long serialVersionUID = -7268578251219962661L;

	private static final Logger logger = LoggerFactory.getLogger(GeoLocation.class);
	
	private String lat;
	private String lng;
	
	public String getLat() {
		return lat;
	}
	
	public void setLat(String latitude) {
		this.lat = latitude;
	}
	
	public String getLng() {
		return lng;
	}
	
	public void setLng(String longitude) {
		this.lng = longitude;
	}
	
	public String toString() {
		StringBuffer buff = new StringBuffer("--GeoLocation--");

		buff.append("\t LATITUDE = " + getLat());
		buff.append("\t LONGITUDE = " + getLng());
		
		return buff.toString();
	}
}
