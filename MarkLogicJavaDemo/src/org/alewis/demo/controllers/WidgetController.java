package org.alewis.demo.controllers;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.Enumeration;

import javax.servlet.http.HttpServletRequest;

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
public class WidgetController {
	@SuppressWarnings("unused")
	private static final Logger logger = LoggerFactory.getLogger(WidgetController.class);
	
	private RestTemplate getRestTemplate() {
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
	
	public String encodeUrl(String url) {
		try {
	      return URLEncoder.encode(url, "UTF-8");
	    } catch (UnsupportedEncodingException uee) {
	      throw new IllegalArgumentException(uee);
	    }
	}
	
	/**
	 * Intelligently append URL parameters and return a new string
	 * @param url
	 * @param name
	 * @param val
	 * @return
	 */
	private String appendUrlParameter(final String url, final String name, final String val) {
		int qpos = url.indexOf('?');
	    int hpos = url.indexOf('#');
	    char sep = qpos == -1 ? '?' : '&';
	    String seg = sep + encodeUrl(name) + '=' + encodeUrl(val);
	    return hpos == -1 ? url + seg : url.substring(0, hpos) + seg
	        + url.substring(hpos);
	}

	@RequestMapping(value = "widgetProxy", method = RequestMethod.POST)
	public String chartProxy(	@RequestParam String proxyPath, 
							@RequestParam Integer start,
							@RequestParam String view,
							@RequestParam String format,
							@RequestParam Integer pageLength,
							@RequestParam String options,
							HttpServletRequest request) throws Exception {
		
		System.out.println("INSIDE THE PROXY | " + proxyPath);
		String url = Constants.getDatabaseHost() + proxyPath;
		System.out.println(url);
		url = appendUrlParameter(url, "start", start.toString());
		System.out.println(url);
//		url = appendUrlParameter(url, "q", "Adolph");  TODO - need to add the current query along on this
//		System.out.println(url);
		url = appendUrlParameter(url, "options", "person-companyName-state-facet");
		System.out.println(url);
		
		Enumeration<String> e = request.getParameterNames();
		while (e.hasMoreElements()) {
			String name = e.nextElement();
			for (String val : request.getParameterValues(name)) {
				System.out.print(" {" + name + " | " + val + "} ");
			}
		}
		System.out.println();
		
		ResponseEntity<String> response = getRestTemplate().exchange(url, HttpMethod.GET, null, String.class);
		String out = response.getBody();
		//System.out.println(out);
		return out;
	}
}
