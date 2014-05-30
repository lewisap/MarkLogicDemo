package org.alewis.demo.controllers;

import org.alewis.database.Constants;
import org.alewis.http.PreEmptiveAuthHttpRequestFactory;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.Credentials;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.DefaultHttpClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@SuppressWarnings("deprecation")
@RestController
public class MapController {
	@SuppressWarnings("unused")
	private static final Logger logger = LoggerFactory.getLogger(MapController.class);
	
	public RestTemplate getRestTemplate() {
		DefaultHttpClient newHttpClient = new DefaultHttpClient();
		Credentials credentials = new UsernamePasswordCredentials( Constants.username, Constants.password );
		AuthScope authScope = new AuthScope( Constants.hostname, Constants.port, AuthScope.ANY_REALM );
		BasicCredentialsProvider credentialsProvider = new BasicCredentialsProvider();
		credentialsProvider.setCredentials( authScope, credentials );
		newHttpClient.setCredentialsProvider( credentialsProvider );
		
		HttpComponentsClientHttpRequestFactory requestFactory = new PreEmptiveAuthHttpRequestFactory( newHttpClient );
		RestTemplate restTemplate = new RestTemplate();
		restTemplate.setRequestFactory( requestFactory );

		return restTemplate;
	}

	@RequestMapping(value = "mapProxy", method = RequestMethod.POST)
	public void mapProxy(@RequestParam 	String proxyPath) throws Exception {
		System.out.println("INSIDE THE MAP PROXY | " + proxyPath);
		String url = Constants.getDatabaseHost() + proxyPath;
		System.out.println(url);

		ResponseEntity<String> response = getRestTemplate().exchange(url, HttpMethod.GET, null, String.class);
		String out = response.getBody();
		System.out.println(out);
	}
}
