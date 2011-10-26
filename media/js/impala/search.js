$(function() {
    $('#search-facets').delegate('li.facet', 'click', function(e) {
        var $this = $(this);
        if ($this.hasClass('active')) {
            if ($(e.target).is('a')) {
                return;
            }
            $this.removeClass('active');
        } else {
            $this.closest('ul').find('.active').removeClass('active');
            $this.addClass('active');
        }
    }).delegate('a', 'highlight', function(e) {
        // Highlight selection on sidebar.
        var $this = $(this);
        $this.closest('.facet-group').find('.selected').removeClass('selected');
        $this.closest('li').addClass('selected');
    }).delegate('.cnt', 'recount', function(e, newCount) {
        // Update # of results on sidebar.
        var $this = $(this);
        if (newCount.length && $this.html() != newCount.html()) {
            $this.replaceWith(newCount);
        }
    }).delegate('a[data-params]', 'rebuild', function(e) {
        var $this = $(this),
            url = rebuildLink($this.attr('href'), $this.attr('data-params'));
        $this.attr('href', url);
    });
    if ($('body').hasClass('pjax') && $.support.pjax && z.capabilities.JSON) {
        $('#pjax-results').initSearchPjax($('#search-facets'));
    }
});


function rebuildLink(url, urlparams, qs) {
    var params = JSON.parseNonNull(urlparams),
        newVars = $.extend(z.getVars(qs), params);
    return url.split('?')[0] + '?' + $.param(newVars);
}


$.fn.initSearchPjax = function($filters) {
    var $container = $(this),
        container = $container.selector,
        $triggered;

    function pjaxOpen(url) {
        var urlBase = location.pathname + location.search;
        if (!!url && url != '#' && url != urlBase) {
            $.pjax({
                url: url,
                container: container,
                timeout: 5000
            });
        }
    }

    function hijackLink() {
        $triggered = $(this);
        pjaxOpen($triggered.attr('href'));
    }

    function loading() {
        var $wrapper = $container.closest('.results'),
            msg = gettext('Updating results&hellip;'),
            cls = 'updating';
        $wrapper.addClass('loading');

        // The loading throbber is absolutely positioned atop the
        // search results, so we do this to ensure a max-margin of sorts.
        if ($container.outerHeight() > 300) {
            cls += ' tall';
        }

        // Insert the loading throbber.
        $('<div>', {'class': cls, 'html': msg}).insertBefore($container);

        $container.trigger('search.loading');
    }

    function finished() {
        var $wrapper = $container.closest('.results');

        // Initialize install buttons and compatibility checking.
        $.when($container.find('.install:not(.triggered)')
                         .installButton()).done(function() {
            $container.find('.install').addClass('triggered');
            initListingCompat();
        });

        // Remove the loading throbber.
        $wrapper.removeClass('loading').find('.updating').remove();

        // Update the # of matching results on sidebar.
        $filters.find('.cnt').trigger('recount', [$wrapper.find('.cnt')]);

        // Update GET parameters of sidebar anchors.
        $filters.find('a[data-params]').trigger('rebuild');

        // Highlight selection on sidebar.
        $triggered.trigger('highlight');

        // Scroll up to top of page.
        $('html, body').animate({scrollTop: 0}, 200);

        $container.trigger('search.finished');
    }

    function turnPages(e) {
        if (fieldFocused(e)) {
            return;
        }
        if (e.which == $.ui.keyCode.LEFT || e.which == $.ui.keyCode.RIGHT) {
            e.preventDefault();
            var sel;
            if (e.which == $.ui.keyCode.LEFT) {
                sel = '.paginator .prev:not(.disabled)';
            } else {
                sel = '.paginator .next:not(.disabled)';
            }
            pjaxOpen($container.find(sel).attr('href'));
        }
    }

    $('.pjax-trigger a').live('click', _pd(hijackLink));
    $container.bind('start.pjax', loading).bind('end.pjax', finished);
    $(document).keyup(_.throttle(turnPages, 300));
};
