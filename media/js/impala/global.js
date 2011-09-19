//bind pager controls to our addon grids
$('.island .listing-grid').bind('grid.init', function(e, data) {
    var $grid = data.self,
        numPages = data.maxPage;

    if (numPages > 1) {
        var $nav = $('<nav class="pager">');
        $nav.append('<a href="#" class="prev">&laquo;</a>');
        for (var i=0; i<=numPages; i++) {
            $nav.append('<a href="#" class="' + (i==0 ? 'selected ': '') + 'dot"><b></b></a>');
        }
        $nav.append('<a href="#" class="next">&raquo;</a>');
        $grid.parent().prepend($nav);
        $nav.delegate('a', 'click', function(e) {
            e.preventDefault();
            var $tgt = $(this);
            if ($tgt.hasClass('dot')) {
                $grid.go($tgt.index() - 1);
            } else if ($tgt.hasClass('prev')){
                $grid.prevPage();
            } else if ($tgt.hasClass('next')){
                $grid.nextPage();
            }
        });
        $grid.bind('grid.update', function(e, data) {
            $nav.find('.dot').removeClass('selected')
                .eq(data.current).addClass('selected');
        });
    }
});

z.visitor = z.Storage('visitor');
(function() {
    // Show the bad-browser message if it has not been dismissed
    if (!z.visitor.get('seen_badbrowser_warning') && $('body').hasClass('badbrowser')) {
        $('#site-nonfx').show();
    }
})();

function hoverTruncate(grid) {
    var $grid = $(grid);
    if ($grid.hasClass('hovercard')) {
        $grid = $grid.parent();
    }
    $grid.find('.hovercard h3').truncate();
    $grid.delegate('.hovercard', 'mouseover', function() {
        var $el = $(this);
        setTimeout(function() {
            $el.find('h3').untruncate();
        }, 100);
    }).delegate('.hovercard', 'mouseout', function() {
        var $el = $(this);
        setTimeout(function() {
            $el.find('h3').truncate();
        }, 100);
    });
}

function listing_grid() {
    var $grid = $(this),
        $pages = $grid.find('section'),
        current = 0,
        maxPage = $pages.length-1;
    $grid.trigger("grid.init", {self: $grid, current: current, maxPage: maxPage});
    $grid.go = function(n) {
        if (n != current) {
            n = n < 0 ? 0 : (n > maxPage ? maxPage : n);
            current = n;
            $pages.hide().eq(n).show().find('.hovercard h3').truncate();
            $grid.trigger("grid.update", {self: $grid, current: current, maxPage: maxPage});
        }
    };
    $grid.prevPage = function() {
        $grid.go(current-1);
    };
    $grid.nextPage = function() {
        $grid.go(current+1);
    };
    hoverTruncate(this);
    $grid.css({
        'width': $grid.width() + 'px',
        'height': $grid.height() + 'px'
    });
    return $grid;
}

$(function() {
    "use strict";

    initBanners();

    // Bind to the mobile site if a mobile link is clicked.
    $(".mobile-link").attr("href", window.location).click(function() {
        $.cookie("mamo", "on", {expires:30});
    });

    // Paginate listing grids.
    $('.listing-grid').each(listing_grid);

    // Truncate titles on single hovercards.
    $('.hovercard').each(function() {
        hoverTruncate(this);
    });

    // load deferred images.
    $('img[data-defer-src]').each(function() {
        var $img = $(this);
        $img.attr('src', $img.attr('data-defer-src'));
    });

    // Email obfuscation.
    $('span.emaillink').each(function() {
        var $this = $(this);
        $this.find('.i').remove();
        var em = $this.text().split('').reverse().join('');
        $this.prev('a').attr('href', 'mailto:' + em);
    });

    $('#page').delegate('.expando .toggle', 'click', _pd(function() {
        $(this).closest('.expando').toggleClass('expanded');
    }));

    $('#page').delegate('.scrollto', 'click', function(e) {
        e.preventDefault();
        var href = $(this).attr('href'),
            $target = $(href.match(/#.*$/)[0]);
        if ($target.hasClass('expando')) {
            $target.addClass('expanded');
        }
        var top = $target.offset().top - 15;
        $(document.documentElement).animate({ scrollTop: top }, 500);
    });

    contributions.init();

    $("select[name='rating']").ratingwidget();
});


function initBanners(delegate) {
    if (!delegate) {
        delegate = document.body;
    }
    // Show the first visit banner.
    if (!z.visitor.get('seen_impala_first_visit')) {
        $('body').addClass('firstvisit');
        z.visitor.set('seen_impala_first_visit', 1);
    }

    $(delegate).delegate('#site-nonfx .close', 'click', function() {
        z.visitor.set('seen_badbrowser_warning', 1);
    });

    // Show the ACR pitch if it has not been dismissed.
    if (!z.visitor.get('seen_acr_pitch') && $('body').hasClass('acr-pitch')) {
        $(delegate).find('#acr-pitch').show();
        $(delegate).find('#acr-pitch .close', 'click', function() {
            z.visitor.set('seen_acr_pitch', 1);
        });
    }

    // Allow dismissal of site-balloons.
    $(delegate).delegate('.site-balloon .close, .site-tip .close', 'click', _pd(function() {
        $(this).closest('.site-balloon, .site-tip').fadeOut();
    }));
}

// AJAX form submit

$('form.ajax-submit').live('submit', function() {
    var $this = $(this),
        params = $this.serializeArray();

    $(this).find('.submit, button[type=submit], submit').attr('disabled', true).addClass('loading-submit');
    $.post($this.attr('action'), params, function(d) {
        $this.replaceWith(d);
    });
    return false;
});
