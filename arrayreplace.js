function preg_quote( str ) {
  // http://kevin.vanzonneveld.net
  // +   original by: booeyOH
  // +   improved by: Ates Goral (http://magnetiq.com)
  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   bugfixed by: Onno Marsman
  // *     example 1: preg_quote("$40");
  // *     returns 1: '\$40'
  // *     example 2: preg_quote("*RRRING* Hello?");
  // *     returns 2: '\*RRRING\* Hello\?'
  // *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
  // *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'

  return (str+'').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
}

function ARRAYREPLACE(input,fromList,toList,caseSensitive){
  /* default behavior it is not case sensitive */
  if( caseSensitive == undefined ){
    caseSensitive = false;
  }
  /* if the from list it is not a list, become a list */
  if( typeof fromList != "object" ) {
    fromList = [ fromList ];
  }
  /* if the to list it is not a list, become a list */
  if( typeof toList != "object" ) {
    toList = [ toList ];
  }
  /* force the input be a string */
  var result = input.toString();

  /* iterates using the max size */
  var bigger  = Math.max( fromList.length, toList.length) ;

  /* defines the words separators */
  var arrWordSeparator = [ ".", ",", ";", " " ];

  /* interate into the lists */
  for(var i = 0; i < bigger; i++ ) {
    /* get the word that should be replaced */
    var fromValue = fromList[ ( i % ( fromList.length ) ) ]
    /* get the new word that should replace */
    var toValue = toList[ ( i % ( toList.length ) ) ]

    /* do not replace undefined */
    if ( fromValue == undefined ) {
      continue;
    }
    if ( toValue == undefined ) {
      toValue = "";
    }

    /* apply case sensitive rule */
    var caseRule = "g";
    if( !caseSensitive ) {
      /* make the regex case insensitive */
      caseRule = "gi";
    }

    /* for each end word char, make the replacement and update the result */
    for ( var j = 0; j < arrWordSeparator.length; j++ ) {

      /* from value being the first word of the string */
      result =  result.replace( new RegExp( "^(" + preg_quote( fromValue + arrWordSeparator[ j ] ) + ")" , caseRule ), toValue + arrWordSeparator[ j ] );

      /* from value being the last word of the string */
      result =  result.replace( new RegExp( "(" + preg_quote( arrWordSeparator[ j ] + fromValue ) + ")$" , caseRule ), arrWordSeparator[ j ] + toValue );

      /* from value in the middle of the string between two word separators */
      for ( var k = 0; k < arrWordSeparator.length; k++ ) {
        result =  result.replace( 
          new RegExp( 
            "(" + preg_quote( arrWordSeparator[ j ] + fromValue + arrWordSeparator[ k ] ) + ")" , 
            caseRule 
          ), 
          /* need to keep the same word separators */
          arrWordSeparator[ j ] + toValue + arrWordSeparator[ k ] 
        );
      }
    }

    /* from value it is the only thing in the string */
    result =  result.replace( new RegExp( "^(" + preg_quote( fromValue ) + ")$" , caseRule ), toValue );
  }
  /* return the new result */
  return result;
}
