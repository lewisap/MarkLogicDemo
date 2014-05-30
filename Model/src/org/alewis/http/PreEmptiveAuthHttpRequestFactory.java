package org.alewis.http;

import java.net.URI;

import org.apache.http.HttpHost;
import org.apache.http.client.AuthCache;
import org.apache.http.client.protocol.ClientContext;
import org.apache.http.impl.auth.DigestScheme;
import org.apache.http.impl.client.BasicAuthCache;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.protocol.HttpContext;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;

@SuppressWarnings("deprecation")
public class PreEmptiveAuthHttpRequestFactory extends HttpComponentsClientHttpRequestFactory {

	public PreEmptiveAuthHttpRequestFactory(DefaultHttpClient client) {
		super(client);
	}

	@Override
	protected HttpContext createHttpContext(HttpMethod httpMethod, URI uri) {
		AuthCache authCache = new BasicAuthCache();
//		BasicScheme basicAuth = new BasicScheme();
		DigestScheme digestScheme = new DigestScheme();
		HttpHost targetHost = new HttpHost(uri.getHost(), uri.getPort());
//		authCache.put(targetHost, basicAuth);
		authCache.put(targetHost, digestScheme);
		BasicHttpContext localcontext = new BasicHttpContext();
		localcontext.setAttribute(ClientContext.AUTH_CACHE, authCache);

		return localcontext;
	}
}
